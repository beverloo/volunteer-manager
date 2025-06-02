// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod/v4';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { authenticateUser } from '@lib/auth/Authentication';
import { unsealPasswordResetRequest } from '@lib/auth/PasswordReset';

/**
 * Interface definition for the PasswordResetVerify API, exposed through
 * /api/auth/password-reset-verify.
 */
export const kPasswordResetVerifyDefinition = z.object({
    request: z.object({
        /**
         * The sealed password reset request that the server should verify.
         */
        request: z.string(),
    }),

    response: z.strictObject({
        /**
         * Whether the password reset token could be successfully verified.
         */
        success: z.boolean(),

        /**
         * The first name of the user whose information is being reset when successful.
         */
        firstName: z.string().optional(),
    }),
});

export type PasswordResetVerifyDefinition = ApiDefinition<typeof kPasswordResetVerifyDefinition>;

type Request = ApiRequest<typeof kPasswordResetVerifyDefinition>;
type Response = ApiResponse<typeof kPasswordResetVerifyDefinition>;

/**
 * API that verifies a password reset request by unsealing the request, and running the necessary
 * database queries to check whether the request has been issued and settled in the past. When the
 * verification has passed, additional information is returned to personalize the flow.
 */
export async function passwordResetVerify({ request }: Request, props: ActionProps)
    : Promise<Response>
{
    const passwordResetRequest = await unsealPasswordResetRequest(request);
    if (passwordResetRequest) {
        const { user } = await authenticateUser({ type: 'session', ...passwordResetRequest });
        if (user) {
            return {
                success: true,
                firstName: user.firstName,
            };
        }
    }

    return { success: false };
}
