// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Log, LogType, LogSeverity } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { authenticateUser } from '@lib/auth/Authentication';
import { writeSealedSessionCookie } from '@lib/auth/Session';

/**
 * Interface definition for the Sign in API, exposed through /api/auth/sign-in-impersonate.
 */
export const kSignInImpersonateDefinition = z.object({
    request: z.object({
        /**
         * Unique ID of the user to whom the administrator should be logged in.
         */
        userId: z.number(),

        /**
         * Optional URL the user should be returned to when signing back in to their own account.
         */
        returnUrl: z.string().optional(),
    }),

    response: z.strictObject({
        /**
         * Whether the sign in attempt was successful.
         */
        success: z.boolean(),
    }),
});

export type SignInImpersonateDefinition = z.infer<typeof kSignInImpersonateDefinition>;

type Request = SignInImpersonateDefinition['request'];
type Response = SignInImpersonateDefinition['response'];

/**
 * API that allows administrators to sign in to another account, as a means of impersonation. Used
 * to verify access and permission behaviour throughout the portal.
 */
export async function signInImpersonate(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !can(props.user, Privilege.Administrator))
        noAccess();

    const impersonatedUser = await authenticateUser({ type: 'userId', userId: request.userId });
    if (!impersonatedUser)
        return { success: false };  // unable to find the user

    await writeSealedSessionCookie({
        id: impersonatedUser.userId,
        token: impersonatedUser.sessionToken,
        parent: {
            id: props.user.userId,
            token: props.user.sessionToken,
        },
    }, props.responseHeaders);

    await Log({
        type: LogType.AdminImpersonateVolunteer,
        severity: LogSeverity.Warning,
        sourceUser: props.user,
        targetUser: impersonatedUser,
    });

    return { success: true };
}
