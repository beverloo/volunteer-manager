// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { LogType, Log } from '@lib/Log';
import { Privilege, can } from '@app/lib/auth/Privileges';
import { storeAvatarData } from '@lib/database/AvatarStore';
import { sql } from '@lib/database';

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
    if (!props.user || !can(props.user, Privilege.ReplaceOwnAvatar))
        return noAccess();

    const userId = props.user.userId;
    const avatarId = await storeAvatarData(userId, Buffer.from(request.avatar, 'base64'));

    if (avatarId) {
        const result = await sql`UPDATE users SET avatar_id=${avatarId} WHERE user_id=${userId}`;
        if (result.ok && result.affectedRows === 1) {
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
