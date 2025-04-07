// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tUsers } from '@lib/database';

/**
 * Interface definition for the Volunteer API, exposed through /api/admin/verify-discord.
 */
export const kVerifyDiscordDefinition = z.object({
    request: z.object({
        /**
         * ID of the user for whom information is being updated.
         */
        userId: z.number(),
    }),
    response: z.strictObject({
        /**
         * Whether the updates were stored successfully.
         */
        success: z.boolean(),

        /**
         * Optional error message to show when something goes wrong.
         */
        error: z.string().optional(),
    }),
});

export type VerifyDiscordDefinition = ApiDefinition<typeof kVerifyDiscordDefinition>;

type Request = ApiRequest<typeof kVerifyDiscordDefinition>;
type Response = ApiResponse<typeof kVerifyDiscordDefinition>;

/**
 * API that marks a volunteer's Discord handle as having been verified.
 */
export async function verifyDiscord(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        permission: {
            permission: 'volunteer.account.information',
            operation: 'update',
        },
    });

    const affectedRows = await db.update(tUsers)
        .set({
            discordHandleUpdated: null,
        })
        .where(tUsers.userId.equals(request.userId))
            .and(tUsers.discordHandleUpdated.isNotNull())
        .executeUpdate();

    if (!!affectedRows) {
        RecordLog({
            type: kLogType.AdminVerifyDiscord,
            severity: kLogSeverity.Warning,
            sourceUser: props.user,
            targetUser: request.userId,
        });
    }

    return { success: !!affectedRows };
}
