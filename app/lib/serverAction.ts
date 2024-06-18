// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { ZodObject, ZodRawShape, z } from 'zod';
import { ZodError, ZodFirstPartyTypeKind } from 'zod';

/**
 * Type definition for the props that will be made available to a server action implementation.
 */
type ServerActionProps = {
    // TODO: authenticationContext
    // TODO: ip
    // TODO: user
};

/**
 * Type definition that represents the result of a React server action function.
 */
type ServerActionResult = {
    /**
     * Boolean indicating whether the server action was processed successfully.
     */
    success: true,

    // TODO: Support `redirect` to automatically redirect the user to another page.
    // TODO: Support `refresh` to automatically refresh using the Next.js router.

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
type ServerAction = (formData: FormData) => Promise<ServerActionResult>;

/**
 * Type definition that represents a React server action. When the action does not return any value
 * success will be assumed, whereas exceptions will be represented as a failure.
 */
type ServerActionImplementation<T extends ZodObject<ZodRawShape, any, any>> =
    (data: z.output<T>, props: ServerActionProps) => Promise<ServerActionResult | undefined | void>;

/**
 * Types that the `coerceZodType` function can coerce string values to.
 */
type ServerActionCoercedTypes =
    boolean | boolean[] | number | number[] | string | string[] | undefined | undefined[];

/**
 * Coerces the given `value` to either a boolean, a string when it has an invalid value, or the
 * `undefined` value when it is something unparseable such as a file.
 */
function coerceZodBoolean(value: FormDataEntryValue): boolean | string | undefined {
    switch (value) {
        case 'on':  // checkboxes
        case 'true':
            return true;

        case 'off':  // for consistency
        case 'false':
            return false;

        default:
            return typeof value === 'string' ? value : undefined;
    }
}

/**
 * Coerces the given `value` to the type represented by the given `def`, which is a Zod type
 * definition. The `typeName` field is not included in the base definition, but always exists.
 */
function coerceZodType(def: any, values: FormDataEntryValue[]): ServerActionCoercedTypes {
    // TODO: Deal with File entries in `values`

    switch (def.typeName) {
        case ZodFirstPartyTypeKind.ZodArray:
            return values.map(value => coerceZodType(def.type._def, [ value ])) as any[];
        case ZodFirstPartyTypeKind.ZodBoolean:
            return coerceZodBoolean(values[0]);
    }

    // TODO: Coerce bigints
    // TODO: Coerce files
    // TODO: Coerce ...

    return typeof values[0] === 'string' ? values[0] : '_skip_';
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
 * Function that wraps an asynchronous `action` to provide consistent input and output, as well as
 * Zod-based validation based on the given `scheme`.
 *
 * This function returns a plain React server action that takes a `FormData  as input. The received
 * data will be validated against the scheme, and be made available in a fully typed manner. React
 * takes care of version skew and common attack types, which we build upon by automatically
 * authenticating the user.
 */
export function serverAction<T extends ZodObject<ZodRawShape, any, any>>(
    scheme: T, action: ServerActionImplementation<T>): ServerAction
{
    return async (formData: FormData) => {
        if (!(formData instanceof FormData))
            return { success: false, error: 'Invalid form data received from Next.js' };

        try {
            const data = scheme.parse(coerceFormData(scheme, formData));
            const props: ServerActionProps = {
                // TODO: Populate the props
            };

            const result = await action(data, props);
            if (typeof result === 'object')
                return result;

            return { success: true };

        } catch (error: any) {
            if (error instanceof ZodError)
                return { success: false, error: formatZodError(error) };

            // TODO: Implement support for other exception types
            return { success: false, error: error.message };
        }
    };
}
