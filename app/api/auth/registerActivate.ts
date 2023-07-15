// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { activateAccount } from '@lib/auth/Authentication';
import { unsealRegistrationRequest } from '@lib/auth/RegistrationRequest';

/**
 * Interface definition for the RegisterActivate API, exposed through /api/auth/register-activate.
 */
export const kRegisterActivateDefinition = z.object({
    request: z.object({
        /**
         * The registration request for which the account should be activated.
         */
        registrationRequest: z.string(),
    }),

    response: z.strictObject({
        /**
         * Whether the account was activated successfully. When set to `true`, the authentication
         * cookie will be set automatically for the user as well.
         */
        success: z.boolean(),

        /**
         * When successful, the user's first name is included to personalize the interface.
         */
        firstName: z.string().optional(),

        /**
         * When successful and available, the URL the user should be redirected to after activation.
         */
        redirectUrl: z.string().optional(),
    }),
});

export type RegisterActivateDefinition = z.infer<typeof kRegisterActivateDefinition>;

type Request = RegisterActivateDefinition['request'];
type Response = RegisterActivateDefinition['response'];

/**
 * This API enables the client to confirm their registration attempt. Typically the registration
 * token will be send to them by e-mail, after which they end up back on the volunteer manager.
 */
export async function registerActivate(request: Request, props: ActionProps): Promise<Response> {
    const registrationRequest = await unsealRegistrationRequest(request.registrationRequest);
    if (!registrationRequest)
        return { success: false };  // invalid or expired registration request

    const user = await activateAccount(registrationRequest.id);
    if (!user)
        return { success: false };  // the account does not exist, or has already been activated

    return {
        success: true,
        firstName: user.firstName,
        redirectUrl: registrationRequest.redirectUrl,
    };
}
