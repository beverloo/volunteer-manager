// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { SessionData } from './Session';
import { type UserDatabaseRow, User } from './User';

import { AuthType } from '../database/Types';
import { securePasswordHash } from './Password';
import db, { sql, tStorage, tUsers, tUsersAuth } from '../database';

/**
 * Fetches authentication data for a particular user. Will be relayed to the frontend allowing them
 * to sign in to their account, preferably using passkeys.
 */
interface AuthenticationData {
    /**
     * Whether the account has been activated already.
     */
    activated: boolean;

    /**
     * Bytes containing the credential Id using which the user has registered.
     */
    credentialId?: string;

    /**
     * Bytes containing the public key using which the user has registered.
     */
    publicKey?: string;
}

/**
 * Interface containing all the information that must be known when creating a new account.
 */
interface AccountCreationData {
    /**
     * The username of the account that should be created.
     */
    username: string;

    /**
     * The password associated with that account, SHA256 hashed.
     */
    password: string;

    /**
     * The user's first name.
     */
    firstName: string;

    /**
     * The user's last name.
     */
    lastName: string;

    /**
     * Gender of the user. A string because we don't care.
     */
    gender: string;

    /**
     * Date on which the user was born. (YYYY-MM-DD)
     */
    birthdate: string;

    /**
     * Phone number of the user, in an undefined format.
     */
    phoneNumber: string;
}

/**
 * Activates the account with the given `userId`. The account must not have been activated yet. Will
 * return an instance of the User class when successful, or undefined when a failure occurred.
 */
export async function activateAccount(userId: number): Promise<User | undefined> {
    const confirmation = await db.selectFrom(tUsers)
        .where(tUsers.userId.equals(userId))
        .select({
            activated: tUsers.activated,
            sessionToken: tUsers.sessionToken,
        })
        .executeSelectNoneOrOne();

    if (!confirmation || !!confirmation.activated)
        return undefined;  // unknown user, or the account is already activated

    const affectedRows = await db.update(tUsers)
        .set({ activated: 1 })
        .where(tUsers.userId.equals(userId))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    if (!affectedRows)
        return undefined;  // the account could not be activated

    return authenticateUser({ type: 'userId', userId });
}

/**
 * Type of input that can be used to authenticate users. Used by `authenticateUser()`.
 */
export type AuthenticateUserParams =
    { type: 'password', username: string, sha256Password: string } |
    { type: 'session' } & SessionData |
    { type: 'userId', userId: number };

/**
 * Attempts to authenticate the user based on the given authentication `type` and `params`. An
 * instance of the `User` class will be returned when the given information was correct, whereas
 * `undefined` will be returned when something went wrong.
 */
export async function authenticateUser(params: AuthenticateUserParams): Promise<User | undefined> {
    const storageJoin = tStorage.forUseInLeftJoin();

    const dbInstance = db;
    const authenticationBaseSelect = db.selectFrom(tUsers)
        .innerJoin(tUsersAuth)
            .on(tUsersAuth.userId.equals(tUsers.userId))
        .leftJoin(storageJoin)
            .on(storageJoin.fileId.equals(tUsers.avatarId))
        .groupBy(tUsers.userId)
        .select({
            userId: tUsers.userId,
            username: tUsers.username,
            firstName: tUsers.firstName,
            lastName: tUsers.lastName,
            gender: tUsers.gender,
            birthdate: tUsers.birthdate,
            phoneNumber: tUsers.phoneNumber,
            avatarFileHash: storageJoin.fileHash,
            privileges: tUsers.privileges,
            activated: tUsers.activated,
            sessionToken: tUsers.sessionToken,

            // For internal use only, as behaviour for access code differs from passwords.
            authType: tUsersAuth.authType,
        });

    let authenticationQuery: ReturnType<typeof authenticationBaseSelect['executeSelectNoneOrOne']>;
    let includeAuthType = false;

    switch (params.type) {
        case 'password':
            const securelyHashedPassword = await securePasswordHash(params.sha256Password);

            includeAuthType = true;
            authenticationQuery = authenticationBaseSelect
                .where(tUsers.username.equals(params.username))
                    .and(tUsers.activated.equals(/* true= */ 1))
                    .and(tUsersAuth.authType.equals(AuthType.password)
                        .and(tUsersAuth.authValue.equals(securelyHashedPassword)))
                    .or(tUsersAuth.authType.equals(AuthType.code)
                    .and(dbInstance.fragmentWithType('boolean', 'required').sql`
                        SHA2(${tUsersAuth.authValue}, 256) =
                            ${dbInstance.const(securelyHashedPassword, 'string')}`))
                .executeSelectNoneOrOne();

            break;

        case 'session':
            authenticationQuery = authenticationBaseSelect
                .where(tUsers.userId.equals(params.id))
                    .and(tUsers.sessionToken.equals(params.token))
                .executeSelectNoneOrOne();

            break;

        case 'userId':
            authenticationQuery = authenticationBaseSelect
                .where(tUsers.userId.equals(params.userId))
                .executeSelectNoneOrOne();

            break;

        default:
            throw new Error('Invalid authentication type was provided');
    }

    const authenticationResult = await authenticationQuery;
    if (!authenticationResult)
        return undefined;

    return new User(authenticationResult, includeAuthType ? authenticationResult.authType
                                                          : undefined);
}

/**
 * Creates an account based on the given `data`. Will return a number indicating user ID when the
 * account was created successfully, or undefined. Failure only happens when the SQL queries fail.
 */
export async function createAccount(data: AccountCreationData): Promise<undefined | number> {
    const userTableResult =
        await sql`
            INSERT INTO
                users
                (username, first_name, last_name, gender, birthdate, phone_number)
            VALUES
                (${data.username}, ${data.firstName}, ${data.lastName}, ${data.gender},
                 ${data.birthdate}, ${data.phoneNumber})`;

    if (!userTableResult.ok || !userTableResult.insertId) {
        console.error('Unable to write into the users table:', userTableResult.error);
        return undefined;
    }

    const securelyHashedPassword = await securePasswordHash(data.password);
    const userId = userTableResult.insertId;

    const authenticationTableResult =
        await sql`
            INSERT INTO
                users_auth
                (user_id, auth_type, auth_value)
            VALUES
                (${userId}, "password", ${securelyHashedPassword})`;

    if (!authenticationTableResult.ok) {
        console.error('Unable to write in the users_auth table:', authenticationTableResult.error);
        return undefined;
    }

    return userId;
}

/**
 * Gets the authentication data for the given `username` from the database. A return value of
 * `undefined` means that the user could not be found, whereas every other return value means
 * that the user exists, and possibly registered using a passkey.
 */
export async function getAuthenticationData(username: string)
    : Promise<AuthenticationData | undefined>
{
    const user = await db.selectFrom(tUsers)
        .select({ activated: tUsers.activated })
        .where(tUsers.username.equals(username))
        .executeSelectNoneOrOne();

    if (!user)
        return undefined;

    return {
        activated: !!user.activated,
        credentialId: undefined,  // TODO: Support WebAuthn
        publicKey: undefined,  // TODO: Support WebAuthn
    };
}

/**
 * Returns whether the given `username` is available.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
    const user = await db.selectFrom(tUsers)
        .select({ userId: tUsers.userId })
        .where(tUsers.username.equals(username))
        .executeSelectNoneOrOne();

    return !user;
}
