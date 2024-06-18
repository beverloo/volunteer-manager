// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { AnyZodObject, z } from 'zod';

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
type ServerActionImplementation<T extends AnyZodObject> =
    (data: z.output<T>, props: ServerActionProps) => Promise<ServerActionResult | void>;

/**
 * Function that wraps an asynchronous `action` to provide consistent input and output, as well as
 * Zod-based validation based on the given `scheme`.
 *
 * This function returns a plain React server action that takes a `FormData  as input. The received
 * data will be validated against the scheme, and be made available in a fully typed manner. React
 * takes care of version skew and common attack types, which we build upon by automatically
 * authenticating the user.
 */
export function serverAction<T extends AnyZodObject>(
    scheme: T, action: ServerActionImplementation<T>): ServerAction
{
    return async (formData: FormData) => {
        // TODO: Validate the incoming `formData` and transform it in a typed structure.
        // TODO: Invoke the `action` when validation has succeeded.

        return {
            success: false,
            error: 'Not yet implemented',
        }
    };
}
