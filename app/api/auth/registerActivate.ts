// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { LogType, Log } from '@lib/Log';
import { authenticateUser, getUserSessionToken } from '@lib/auth/Authentication';
import { unsealRegistrationRequest } from '@lib/auth/RegistrationRequest';
import { writeSealedSessionCookie } from '@lib/auth/Session';
import db, { tUsers } from '@lib/database';

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

    const unactivatedUser = await db.selectFrom(tUsers)
        .where(tUsers.userId.equals(registrationRequest.id))
        .select({
            activated: tUsers.activated,
            sessionToken: tUsers.sessionToken,
        })
        .executeSelectNoneOrOne();

    if (!unactivatedUser || !!unactivatedUser.activated)
        return { success: false };  // the account has already been activated

    const affectedRows = await db.update(tUsers)
        .set({ activated: 1 })
        .where(tUsers.userId.equals(registrationRequest.id))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    if (!affectedRows)
        return { success: false };  // unable to update the user in the database?

    const { user } = await authenticateUser({ type: 'userId', userId: registrationRequest.id });
    const sessionToken = await getUserSessionToken(registrationRequest.id);

    if (!user || !sessionToken)
        return { success: false };  // the user must be disabled for another reason

    await writeSealedSessionCookie({ id: user.userId, token: sessionToken }, props.responseHeaders);
    await Log({
        type: LogType.AccountActivate,
        sourceUser: user,
        data: { ip: props.ip },
    });

    return {
        success: true,
        firstName: user.firstName,
        redirectUrl: registrationRequest.redirectUrl,
    };
}
