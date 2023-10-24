// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { VerifiedRegistrationResponse } from '@simplewebauthn/server';

import type { User } from '@lib/auth/User';
import db, { tUsersPasskeys, tUsers } from '@lib/database';

type PasskeyRegistration = NonNullable<VerifiedRegistrationResponse['registrationInfo']>;

/**
 * Stores the given `registration` in the database associated with the `user`.
 */
export async function storePasskeyRegistration(user: User, registration: PasskeyRegistration)
    : Promise<void>
{
    await db.insertInto(tUsersPasskeys)
        .set({
            userId: user.userId,
            credentialId: registration.credentialID,
            credentialOrigin: registration.origin,
            credentialPublicKey: registration.credentialPublicKey,
            credentialDeviceType: registration.credentialDeviceType,
            credentialBackedUp: registration.credentialBackedUp ? 1 : 0,
            counter: BigInt(registration.counter),
        })
        .executeInsert();
}

/**
 * Retrieves the most recent challenge that was created for the given `user`.
 */
export async function retrieveUserChallenge(user: User): Promise<string | null> {
    return db.selectFrom(tUsers)
        .selectOneColumn(tUsers.challenge)
        .where(tUsers.userId.equals(user.userId))
        .executeSelectNoneOrOne();
}

/**
 * Stores the `challenge` as the most recent challenge that was created for the `user`.
 */
export async function storeUserChallenge(user: User, challenge: string | null): Promise<void> {
    await db.update(tUsers)
        .set({ challenge })
        .where(tUsers.userId.equals(user.userId))
        .executeUpdate();
}
