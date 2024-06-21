// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { headers } from 'next/headers';

import type { ZodObject, ZodRawShape, z } from 'zod';
import { ZodError, ZodFirstPartyTypeKind } from 'zod';

import type { User } from './auth/User';
import { getAuthenticationContextFromHeaders, type AuthenticationContext }
    from './auth/AuthenticationContext';

/**
 * Type definition for the props that will be made available to a server action implementation.
 */
type ServerActionProps = {
    /**
     * Authentication context describing the privileges of the visitor.
     */
    authenticationContext: AuthenticationContext;

    /**
     * Host that the request is targetted towards.
     */
    host?: string;

    /**
     * IP address of the source of the request.
     */
    ip?: string;

    /**
     * User descriptor when the visitor is signed in to an account.
     */
    user?: User;
};

/**
 * Type definition that represents the result of a React server action function.
 */
export type ServerActionResult = {
    /**
     * Boolean indicating whether the server action was processed successfully.
     */
    success: true,

    // TODO: Support `redirect` to automatically redirect the user to another page.
    // TODO: Support `refresh` to automatically refresh using the Next.js router.
    // TODO: Support arbitrary data payloads.

} | {
    /**
     * Boolean indicating whether the server action was processed successfully.
     */
    success: false,

    /**
     * Optional error message that explains what went wrong.
     */
    error?: string;
};

/**
 * Type definition that represents a plain React server action.
 */
export type ServerAction = (formData: unknown) => Promise<ServerActionResult>;

/**
 * Type definition that represents a React server action. When the action does not return any value
 * success will be assumed, whereas exceptions will be represented as a failure.
 */
export type ServerActionImplementation<T extends ZodObject<ZodRawShape, any, any>> =
    (data: z.output<T>, props: ServerActionProps) => Promise<ServerActionResult | undefined | void>;

/**
 * Basic types that the `coerceZodType` function can coerce string values to.
 */
type ServerActionCoercedBasicTypes = File | boolean | null | number | string | undefined;

/**
 * Types that the `coerceZodType` function can coerce string values to.
 */
type ServerActionCoercedTypes = ServerActionCoercedBasicTypes | ServerActionCoercedBasicTypes[];

/**
 * Coerces the given `value` to either a boolean, a string when it has an invalid value, or the
 * `undefined` value when it is something unparseable such as a file.
 */
function coerceZodBoolean(value: FormDataEntryValue): FormDataEntryValue | boolean {
    switch (value) {
        case 'on':  // checkboxes
        case 'true':
            return true;

        case 'off':  // for consistency with checkboxes
        case 'false':
            return false;
    }

    return value;
}

/**
 * Coerces the given `value` to the type represented by the given `def`, which is a Zod type
 * definition. The `typeName` field is not included in the base definition, but always exists.
 */
function coerceZodType(def: any, values: FormDataEntryValue[]): ServerActionCoercedTypes {
    do {
        if (def.typeName === ZodFirstPartyTypeKind.ZodEffects)
            def = def.schema._def;

        if (def.typeName === ZodFirstPartyTypeKind.ZodNullable) {
            if (!!values.length && (values[0] === null || values[0] === 'null'))
                return null;

            def = def.innerType._def;
        }

        if (def.typeName === ZodFirstPartyTypeKind.ZodOptional) {
            if (!values.length || (values[0] === undefined || values[0] === 'undefined'))
                return undefined;

            def = def.innerType._def;
        }

    } while (
        def.typeName === ZodFirstPartyTypeKind.ZodEffects ||
        def.typeName === ZodFirstPartyTypeKind.ZodOptional ||
        def.typeName === ZodFirstPartyTypeKind.ZodNullable);

    switch (def.typeName) {
        case ZodFirstPartyTypeKind.ZodArray:
            return values.map(value => coerceZodType(def.type._def, [ value ])) as any[];
        case ZodFirstPartyTypeKind.ZodBoolean:
            return coerceZodBoolean(values[0]);
    }

    return values[0];
}

/**
 * Coerces the given `formData` into an object that roughly corresponds to the `scheme` without
 * invoking processing and transformation functions. This allows certain types such as arrays,
 * booleans and numbers to work as expected.
 */
function coerceFormData<T extends ZodObject<ZodRawShape, any, any>>(scheme: T, formData: FormData) {
    const unvalidatedData: Record<string, ServerActionCoercedTypes> = { /* empty */ };
    for (const key of formData.keys()) {
        const values = formData.getAll(key);
        if (Object.hasOwn(scheme.shape, key)) {
            if (values.length > 0)
                unvalidatedData[key] = coerceZodType(scheme.shape[key]._def, values);
            else
                unvalidatedData[key] = undefined;

        } else if (values.length >= 1 && typeof values[0] === 'string') {
            // Only string values are supported as arbitrary key/value pass-through.
            unvalidatedData[key] = values[0];
        }
    }

    return unvalidatedData;
}

/**
 * Function that takes a Zod-created `error` and formats it into a single string, that's slightly
 * more user readable than the `error`'s own message.
 */
export function formatZodError(error: ZodError): string {
    const errors: string[] = [];
    for (const issue of error.issues)
        errors.push(`Field ${issue.path.join('.')}: ${issue.message}`);

    return errors.join('; ');
}

/**
 * Executes the server action implemented in the given `action`, ensuring consistent input (the
 * given `formData`, either a `FormData` instance or a POD object) and output across our system. The
 * input will be strongly validated, and the user will be authenticated.
 *
 * This function must only be called in asynchronous functions that have a 'use server' declaration
 * as the first statement in their body, per the rules of React's Server Actions. Furthermore, React
 * takes care of version skew and common attack types, which we build upon with further validation.
 */
export async function executeServerAction<T extends ZodObject<ZodRawShape, any, any>>(
    formData: unknown, scheme: T, action: ServerActionImplementation<T>)
        : Promise<ServerActionResult>
{
    try {
        // -----------------------------------------------------------------------------------------
        // (1) Validate the input data for the incoming action
        // -----------------------------------------------------------------------------------------

        let unverifiedData: unknown;
        if (formData instanceof FormData)
            unverifiedData = coerceFormData(scheme, formData);
        else if (!!formData && typeof formData === 'object')
            unverifiedData = formData;
        else
            return { success: false, error: 'Invalid data received from Next.js' };

        const data = scheme.parse(unverifiedData);

        // -----------------------------------------------------------------------------------------
        // (2) Compose the request properties part of this action
        // -----------------------------------------------------------------------------------------

        const requestHeaders = headers();

        const authenticationContext = await getAuthenticationContextFromHeaders(requestHeaders);

        const props: ServerActionProps = {
            authenticationContext,
            host: requestHeaders.get('host') ?? 'animecon.team',
            ip: requestHeaders.get('x-forwarded-for') ?? undefined,
            user: authenticationContext.user,
        };

        // -----------------------------------------------------------------------------------------
        // (3) Execute the actual server action with all validated and gathered data
        // -----------------------------------------------------------------------------------------

        const result = await action(data, props);
        if (typeof result === 'object')
            return result;

        return { success: true };

    } catch (error: any) {
        if (error instanceof ZodError)
            return { success: false, error: formatZodError(error) };

        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
