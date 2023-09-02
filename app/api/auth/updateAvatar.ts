// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { FileType } from '@lib/database/Types';
import { LogType, Log } from '@lib/Log';
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
    }),
    response: z.strictObject({
        /**
         * Whether the sign out operation could be completed successfully.
         */
        success: z.boolean(),
    }),
});

export type UpdateAvatarDefinition = z.infer<typeof kUpdateAvatarDefinition>;

type Request = UpdateAvatarDefinition['request'];
type Response = UpdateAvatarDefinition['response'];

/**
 * API that allows a user to update an avatar. In most cases this will be about their own avatar,
 * although select volunteers have the ability to update avatars belonging to other people as well.
 */
export async function updateAvatar(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        return noAccess();

    const { userId } = props.user;

    const avatarId = await storeBlobData({
        bytes: Buffer.from(request.avatar, 'base64'),
        mimeType: 'image/png',
        type: FileType.Avatar,
        userId,
    });

    if (avatarId) {
        const affectedRows = await db.update(tUsers)
            .set({ avatarId })
            .where(tUsers.userId.equals(userId))
            .executeUpdate();

        if (!!affectedRows) {
            await Log({
                type: LogType.AccountUpdateAvatar,
                sourceUser: props.user,
                data: { ip: props.ip },
            });

            return { success: true };
        }
    }

    return { success: false };
}
