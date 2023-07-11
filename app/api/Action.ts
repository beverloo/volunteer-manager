// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import type { ZodObject, ZodRawShape, z } from 'zod';

/**
 * Additional properties made available to actions that allow actions to use or manipulate lasting
 * state, such as understanding who the signed in user is and getting or setting headers.
 */
export interface ActionProps {
    // TODO: Additional properties.
}

/**
 * An Action is an asynchronous function that receives validated request data according to a given
 * type, and returns success data according to another given type. Errors that occur during the
 * action must be thrown as an exception.
 *
 * Optionally, an action may consume the `props` object, which enables it to understand who is
 * making the request and alter their state (e.g. sign them out), among other things.
 */
export type Action<T extends ZodObject<ZodRawShape, any, any>> =
    (request: z.infer<T>['request'], props: ActionProps) => Promise<z.infer<T>['response']>;

/**
 * Creates a response for the given `status` and `payload`. Necessary as the Jest test environment
 * does not provide the latest Response.json() static method yet.
 */
function createResponse(status: number, payload: any): NextResponse {
    return new NextResponse(JSON.stringify(payload), {
        status,
    });
}

/**
 * Type for the handling function of response validation errors.
 */
type ResponseValidationErrorHandler = (error: Error) => void;

/**
 * The global response validation error handler. Will be invoked whenever validation of the response
 * value from an Action fails. Errors will be thrown instead when this is set to `undefined`.
 */
let globalResponseValidationErrorHandler: ResponseValidationErrorHandler | undefined;

/**
 * Executes the given `action` for the given `request`, which should validate according to the given
 * `interfaceDefinition`. Both the input coming from the request and the output coming from the
 * action will be validated according to the defined scheme.
 *
 * @param request The NextRequest that was issued
 * @param interfaceDefinition The zod-based definition of the interface, both request and response.
 * @param action The action that is to be executed on the validated request.
 * @returns A NextResponse populated with the resulting information.
 */
export async function executeAction<T extends ZodObject<ZodRawShape, any, any>>(
    request: NextRequest, interfaceDefinition: T, action: Action<T>): Promise<NextResponse>
{
    const requestInterfaceDefinition = interfaceDefinition.pick({ request: true });
    const responseInterfaceDefinition = interfaceDefinition.pick({ response: true });

    try {
        const result = requestInterfaceDefinition.safeParse({ request: await request.json() });
        if (!result.success) {
            return createResponse(500, {
                success: false,
                error: `The server was not able to validate the request. (${result.error.message})`,
            });
        }

        const response = await action(result.data as any, { /* props */ });
        const responseValidation = responseInterfaceDefinition.safeParse({ response });
        if (responseValidation.success)
            return createResponse(200, (responseValidation.data as any).response);

        const responseValidationError =
            new Error(`Action response validation failed: ${responseValidation.error}`);

        if (!globalResponseValidationErrorHandler)
            throw responseValidationError;

        globalResponseValidationErrorHandler(responseValidationError);
        return createResponse(200, response);

    } catch (error: any) {
        return createResponse(500, {
            success: false,
            error: `The server was not able to handle the request. (${error.message})`,
        });
    }
}

/**
 * Sets the handling function that's responsible for dealing with response validation errors to
 * the given `handler`. When no handler is set, an exception will be thrown instead.
 *
 * @param handler The error handling function that should be executed when response validation fails
 */
export function setResponseValidationErrorHandler(handler?: ResponseValidationErrorHandler): void {
    globalResponseValidationErrorHandler = handler;
}
