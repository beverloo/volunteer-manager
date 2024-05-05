// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { type ActionProps, noAccess } from '../Action';
import { FileType } from '@lib/database/Types';
import { LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck, or } from '@lib/auth/AuthenticationContext';
import { storeBlobData } from '@lib/database/BlobStore';
import db, { tUsers } from '@lib/database';

/**
 * Interface definition for the UpdateAvatar API, exposed through /api/auth/update-avatar.
 */
export const kUpdateAvatarDefinition = z.object({
    request: z.object({
        /**
         * The avatar, encoded in the PNG format, represented as a string.
         */
        avatar: z.string(),

        /**
         * User ID that should be amended, if it's not the signed in user. This relies on having
         * additional permissions.
         */
        overrideUserId: z.number().optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the sign out operation could be completed successfully.
         */
        success: z.boolean(),
    }),
});

export type UpdateAvatarDefinition = ApiDefinition<typeof kUpdateAvatarDefinition>;

type Request = ApiRequest<typeof kUpdateAvatarDefinition>;
type Response = ApiResponse<typeof kUpdateAvatarDefinition>;

/**
 * API that allows a user to update an avatar. In most cases this will be about their own avatar,
 * although select volunteers have the ability to update avatars belonging to other people as well.
 */
export async function updateAvatar(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        return noAccess();

    let subjectUserId: number = props.user.userId;
    if (request.overrideUserId && request.overrideUserId !== props.user.userId) {
        executeAccessCheck(props.authenticationContext, {
            privilege: or(Privilege.VolunteerAvatarManagement, Privilege.EventAdministrator),
        });

        subjectUserId = request.overrideUserId;
    }

    const avatarId = await storeBlobData({
        bytes: Buffer.from(request.avatar, 'base64'),
        mimeType: 'image/png',
        type: FileType.Avatar,
        userId: subjectUserId,
    });

    if (avatarId) {
        const affectedRows = await db.update(tUsers)
            .set({ avatarId })
            .where(tUsers.userId.equals(subjectUserId))
            .executeUpdate();

        if (!!affectedRows) {
            if (request.overrideUserId) {
                await Log({
                    type: LogType.AdminUpdateAvatar,
                    sourceUser: props.user,
                    targetUser: request.overrideUserId,
                });
            } else {
                await Log({
                    type: LogType.AccountUpdateAvatar,
                    sourceUser: props.user,
                    data: { ip: props.ip },
                });
            }

            return { success: true };
        }
    }

    return { success: false };
}
