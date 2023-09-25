// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { LogType, Log } from '@lib/Log';

import { AuthType } from '@lib/database/Types';
import { PlaywrightHooks } from '@lib/PlaywrightHooks';
import { authenticateUser } from '@lib/auth/Authentication';
import { securePasswordHash } from '@lib/auth/Password';
import { unsealPasswordResetRequest } from '@lib/auth/PasswordReset';
import { writeSealedSessionCookie } from '@lib/auth/Session';
import db, { tUsers, tUsersAuth } from '@lib/database';

/**
 * Interface definition for the PasswordReset API, exposed through /api/auth/password-reset.
 */
export const kPasswordResetDefinition = z.object({
    request: z.object({
        /**
         * The new password that the user would like to store. Must already be sha256 hashed.
         */
        password: z.string().length(64),

        /**
         * The sealed password reset request that the server should consider.
         */
        request: z.string(),
    }),

    response: z.strictObject({
        /**
         * Whether the new password has been stored.
         */
        success: z.boolean(),
    }),
});

export type PasswordResetDefinition = z.infer<typeof kPasswordResetDefinition>;

type Request = PasswordResetDefinition['request'];
type Response = PasswordResetDefinition['response'];

/**
 * Update the user's password to the given |hashedPassword|, which already should be a SHA-256
 * hashed representation. Optionally the session token can be incremented as well, which will
 * invalidate all other existing sessions.
 *
 * @param userId Unique ID of the user whose password should be updated
 * @param hashedPassword SHA-256 representation of the user's new password.
 */
export async function updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    if (PlaywrightHooks.isActive())
        return;  // no need to actually update a password

    const securelyHashedPassword = await securePasswordHash(hashedPassword);

    const dbInstance = db;
    await dbInstance.transaction(async () => {
        // (1) Delete all old passwords, which should no longer be valid.
        await dbInstance.deleteFrom(tUsersAuth)
            .where(tUsersAuth.userId.equals(userId))
                .and(tUsersAuth.authType.in([ AuthType.code, AuthType.password ]))
            .executeDelete();

        // (2) Store the new password in the authentication table.
        await dbInstance.insertInto(tUsersAuth)
            .values({
                userId: userId,
                authType: AuthType.password,
                authValue: securelyHashedPassword
            })
            .executeInsert(/* min= */ 0, /* max= */ 1);

        // (3) Increment the user's session token, invalidating all other sessions.
        await dbInstance.update(tUsers)
            .set({
                sessionToken: tUsers.sessionToken.add(1),
            })
            .where(tUsers.userId.equals(userId))
            .executeUpdate(/* min= */ 0, /* max= */ 1);
    });
}

/**
 * This API enables the client to reset their password after having lost it. The `request` includes
 * both the (hashed) new password, as well as the password reset request to validate that it's
 * really that user who wishes to reset their password.
 */
export async function passwordReset(request: Request, props: ActionProps): Promise<Response> {
    const passwordResetRequest = await unsealPasswordResetRequest(request.request);
    if (passwordResetRequest) {
        const { user } = await authenticateUser({ type: 'session', ... passwordResetRequest });
        if (user) {
            await updateUserPassword(user.userId, request.password);
            await writeSealedSessionCookie(
                { id: user.userId, token: user.sessionToken + 1 }, props.responseHeaders);

            await Log({
                type: LogType.AccountPasswordReset,
                sourceUser: user,
                data: { ip: props.ip },
            });

            return { success: true };
        }
    }

    return { success: false };
}
