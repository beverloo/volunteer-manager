// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { VerifiedRegistrationResponse } from '@simplewebauthn/server';

import type { ActionProps } from '@app/api/Action';
import type { Temporal } from '@lib/Temporal';
import db, { tUsersPasskeys, tUsers } from '@lib/database';

type PasskeyRegistration = NonNullable<VerifiedRegistrationResponse['registrationInfo']>;

type UserLike = { userId: number };

/**
 * Deletes the `passkeyId` from the `user`'s profile.
 */
export async function deleteCredential(user: UserLike, passkeyId: number): Promise<boolean> {
    return await db.deleteFrom(tUsersPasskeys)
        .where(tUsersPasskeys.userId.equals(user.userId))
            .and(tUsersPasskeys.userPasskeyId.equals(passkeyId))
        .executeDelete() > 0;
}

/**
 * Determines the RpID associated with the request for which `props` was created.
 */
export function determineRpID(props: ActionProps): string {
    return props.origin.replace(/\:.*?$/g, '');
}

/**
 * Description of a credential within our system.
 */
export interface Credential {
    /**
     * Unique ID of the credential as it has been stored in the database.
     */
    passkeyId: number;

    /**
     * Name that was assigned to the passkey. Indicated by the client, potentially untrusted.
     */
    name?: string;

    /**
     * The credential's ID which was assigned by the authenticator.
     */
    credentialId: Uint8Array;

    /**
     * The public key that's associated with this credential.
     */
    credentialPublicKey: Uint8Array;

    /**
     * The counter indicated by the authenticator.
     */
    counter: bigint;

    /**
     * Date on which the credential was created.
     */
    created: Temporal.ZonedDateTime;

    /**
     * Date on which the credential was last used to sign in to an account.
     */
    lastUsed?: Temporal.ZonedDateTime;
}

/**
 * Retrieves the credentials associated with the given `user` that are stored for the `rpID`, which
 * is the origin the Volunteer Manager is presently running on.
 */
export async function retrieveCredentials(user: UserLike, rpID: string): Promise<Credential[]> {
    return db.selectFrom(tUsersPasskeys)
        .select({
            passkeyId: tUsersPasskeys.userPasskeyId,
            name: tUsersPasskeys.credentialName,
            credentialId: tUsersPasskeys.credentialId,
            credentialPublicKey: tUsersPasskeys.credentialPublicKey,
            counter: tUsersPasskeys.counter,
            created: tUsersPasskeys.credentialCreated,
            lastUsed: tUsersPasskeys.credentialLastUsed,
        })
        .where(tUsersPasskeys.userId.equals(user.userId))
            .and(tUsersPasskeys.credentialRpid.equals(rpID))
        .orderBy(tUsersPasskeys.credentialLastUsed, 'desc nulls last')
            .orderBy(tUsersPasskeys.credentialCreated, 'asc')
        .executeSelectMany();
}

/**
 * Updates the counter and marks the given `passkeyId` as having been used.
 */
export async function updateCredentialCounter(
    user: UserLike, passkeyId: number, counter: bigint): Promise<void>
{
    const dbInstance = db;
    await dbInstance.update(tUsersPasskeys)
        .set({
            credentialLastUsed: dbInstance.currentZonedDateTime(),
            counter,
        })
        .where(tUsersPasskeys.userId.equals(user.userId))
            .and(tUsersPasskeys.userPasskeyId.equals(passkeyId))
        .executeUpdate();
}

/**
 * Stores the given `registration` in the database associated with the `user`.
 */
export async function storePasskeyRegistration(
    user: UserLike, rpID: string, name: string | undefined, registration: PasskeyRegistration)
        : Promise<void>
{
    await db.insertInto(tUsersPasskeys)
        .set({
            userId: user.userId,
            credentialId: Buffer.from(registration.credentialID),
            credentialRpid: rpID,
            credentialName: name,
            credentialOrigin: registration.origin,
            credentialPublicKey: Buffer.from(registration.credentialPublicKey),
            credentialDeviceType: registration.credentialDeviceType,
            credentialBackedUp: registration.credentialBackedUp ? 1 : 0,
            counter: BigInt(registration.counter),
        })
        .executeInsert();
}

/**
 * Retrieves the most recent challenge that was created for the given `user`.
 */
export async function retrieveUserChallenge(user: UserLike): Promise<string | null> {
    return db.selectFrom(tUsers)
        .selectOneColumn(tUsers.challenge)
        .where(tUsers.userId.equals(user.userId))
        .executeSelectNoneOrOne();
}

/**
 * Stores the `challenge` as the most recent challenge that was created for the `user`.
 */
export async function storeUserChallenge(user: UserLike, challenge: string | null): Promise<void> {
    await db.update(tUsers)
        .set({ challenge })
        .where(tUsers.userId.equals(user.userId))
        .executeUpdate();
}
