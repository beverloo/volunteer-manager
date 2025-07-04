// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod/v4';

import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import type { ActionProps } from '../Action';
import { RecordLog, kLogType } from '@lib/Log';
import { authenticateUser } from '@lib/auth/Authentication';
import { updateUserPassword } from './passwordReset';

/**
 * Interface definition for the PasswordChange API, exposed through /api/auth/password-change.
 */
export const kPasswordChangeDefinition = z.object({
    request: z.object({
        /**
         * The current password that the user protects their account with. Must be sha256 hashed.
         */
        currentPassword: z.string().length(64),

        /**
         * The new password that the user would like to store. Must already be sha256 hashed.
         */
        newPassword: z.string().length(64),
    }),

    response: z.strictObject({
        /**
         * Whether the new password has been stored.
         */
        success: z.boolean(),

        /**
         * Optional error message to present to the user.
         */
        error: z.string().optional(),
    }),
});

export type PasswordChangeDefinition = ApiDefinition<typeof kPasswordChangeDefinition>;

type Request = ApiRequest<typeof kPasswordChangeDefinition>;
type Response = ApiResponse<typeof kPasswordChangeDefinition>;

/**
 * This API enables the client to change their password from the user interface.
 */
export async function passwordChange(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        notFound();

    const authenticationAttempt = await authenticateUser({
        type: 'password',
        username: props.user.username!,
        sha256Password: request.currentPassword,
    });

    if (!authenticationAttempt || !authenticationAttempt.user)
        return { success: false, error: 'That is not your current password…' };

    await updateUserPassword(props.user.id, request.newPassword, /* incrementSession= */ false);
    RecordLog({
        type: kLogType.AccountPasswordUpdate,
        sourceUser: props.user,
        data: { ip: props.ip },
    });

    return { success: true };
}
