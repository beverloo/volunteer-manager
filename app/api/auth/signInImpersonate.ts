// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { Log, LogSeverity, kLogType } from '@lib/Log';
import { authenticateUser, getUserSessionToken } from '@lib/auth/Authentication';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
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

export type SignInImpersonateDefinition = ApiDefinition<typeof kSignInImpersonateDefinition>;

type Request = ApiRequest<typeof kSignInImpersonateDefinition>;
type Response = ApiResponse<typeof kSignInImpersonateDefinition>;

/**
 * API that allows administrators to sign in to another account, as a means of impersonation. Used
 * to verify access and permission behaviour throughout the portal.
 */
export async function signInImpersonate(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        permission: 'volunteer.account.impersonation',
    });

    const { user: impersonatedUser } =
        await authenticateUser({ type: 'userId', userId: request.userId });

    const impersonatedUserSessionToken = await getUserSessionToken(request.userId);
    const userSessionToken = await getUserSessionToken(props.user!.userId);

    if (!impersonatedUser || !impersonatedUserSessionToken || !userSessionToken)
        return { success: false };  // unable to find the user

    await writeSealedSessionCookie({
        id: impersonatedUser.userId,
        token: impersonatedUserSessionToken,
        parent: {
            id: props.user!.userId,
            token: userSessionToken,
        },
    }, props.responseHeaders);

    await Log({
        type: kLogType.AdminImpersonateVolunteer,
        severity: LogSeverity.Warning,
        sourceUser: props.user,
        targetUser: impersonatedUser,
    });

    return { success: true };
}
