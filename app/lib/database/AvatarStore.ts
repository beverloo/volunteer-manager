// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { nanoid } from 'nanoid/async';

import { sql } from './index';

/**
 * What is the size limit for avatars we're willing to store in the database?
 */
const kAvatarSizeLimit = 5 * 1024 * 1024;  // 5MB

/**
 * Reads the avatar associated with the given `hash` from the database. Hashes are used because user
 * IDs are sequential, making avatar URLs guessable which is not desirable.
 */
export async function readAvatarDataByHash(hash: string): Promise<string | undefined> {
    const result = await sql`SELECT file_data FROM storage WHERE file_hash=${hash}`;
    if (result.ok && result.rows.length)
        return result.rows[0].file_data;

    return undefined;  // avatar cannot be found
}

/**
 * Stores the avatar represented by the given `data` in the database, associated with the user who
 * is uniquely identified by the given `userId`. Returns the avatar ID when successful.
 */
export async function storeAvatarData(userId: number, data: string): Promise<number | false> {
    if (data.length > kAvatarSizeLimit) {
        console.error('Unable to store an avatar: request too large');
        return false;
    }

    const hash = await nanoid(/* size= */ 12);
    const result = await sql`
        INSERT INTO
            storage
            (file_hash, file_type, file_date, file_data, user_id)
        VALUES
            (${hash}, "avatar", NOW(), ${data}, ${userId})`;

    if (!result.ok)
        console.error('Unable to storage an avatar:', result.error);

    return result.insertId;
}
