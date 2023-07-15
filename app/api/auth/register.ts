// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { createAccount, isUsernameAvailable } from '@lib/auth/Authentication';
import { sealRegistrationRequest } from '@lib/auth/RegistrationRequest';

/**
 * Interface definition for the Register API, exposed through /api/auth/register.
 */
export const kRegisterDefinition = z.object({
    request: z.object({
        /**
         * The username of the account that should be created.
         */
        username: z.string().email(),

        /**
         * The password associated with that account, SHA256 hashed.
         */
        password: z.string().length(64),

        /**
         * The user's first name.
         */
        firstName: z.string(),

        /**
         * The user's last name.
         */
        lastName: z.string(),

        /**
         * Gender of the user. A string because we don't care.
         */
        gender: z.string(),

        /**
         * Date on which the user was born. (YYYY-MM-DD)
         */
        birthdate: z.string(),

        /**
         * Phone number of the user, in an undefined format.
         */
        phoneNumber: z.string(),

        /**
         * Whether the user has accepted the terms of our privacy policy.
         */
        gdpr: z.boolean(),

        /**
         * Optional URL to which the user should be redirected after they confirm their e-mail
         * address. This often happens in a new tab, so we want to kick them back in a flow.
         */
        redirectUrl: z.string().optional(),
    }),

    response: z.strictObject({
        /**
         * Whether the registration attempt was successful.
         */
        success: z.boolean(),

        /**
         * The error message that occurred when `success` is not set to true.
         */
        error: z.string().optional(),
    }),
});

export type RegisterDefinition = z.infer<typeof kRegisterDefinition>;

type Request = RegisterDefinition['request'];
type Response = RegisterDefinition['response'];

/**
 * API that allows accounts to be created. The `request` includes all the necessary information,
 * whereas the implementation will do the necessary checks to make sure it's valid.
 */
export async function register(request: Request, props: ActionProps): Promise<Response> {
    const available = await isUsernameAvailable(request.username);
    if (!available)
        return { success: false, error: 'There already is an account with that username.' };

    if (!request.gdpr)
        return { success: false, error: 'You must accept our GDPR & privacy policies.' };

    const userId = await createAccount({
        username: request.username,
        password: request.password,
        firstName: request.firstName,
        lastName: request.lastName,
        gender: request.gender,
        birthdate: request.birthdate,
        phoneNumber: request.phoneNumber,
    });

    if (!userId)
        return { success: false, error: 'The server was unable to create an account.' };

    const registrationRequest = await sealRegistrationRequest({
        id: userId,
        redirectUrl: request.redirectUrl,
    });

    // TODO: Send an e-mail containing the registration verification link.
    props.responseHeaders.set(
        'X-Registration-Link', `${props.origin}/?registration-request=${registrationRequest}`);

    return { success: true };
}
