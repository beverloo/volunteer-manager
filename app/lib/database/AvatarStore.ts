// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { v4 as uuid } from 'uuid';

import { sql } from './index';

/**
 * Returns the avatar Url for the given |hash|. Will return `undefined` when no hash is available.
 */
export function getAvatarUrl(hash?: string): string | undefined {
    return hash ? `/avatars/${hash}.png`
                : undefined;
}

/**
 * Mimics (synchronous) NanoID behaviour using the UUID library. Returns a string of random numbers
 * and letters of the given `length`.
 *
 * @see https://github.com/ai/nanoid/issues/365
 * @todo Switch back to `nanoid` when we can depend on it w/o breaking tests, which have issues
 *       between Jest and ESM modules.
 */
const nanoid = (length: number) => uuid().replaceAll('-', '').slice(0, length);

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
export async function storeAvatarData(userId: number, data: Buffer): Promise<number | false> {
    if (data.length > kAvatarSizeLimit) {
        console.error('Unable to store an avatar: request too large');
        return false;
    }

    const hash = nanoid(/* size= */ 12);
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
