// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { AuthenticationContext, UserAuthenticationContext } from './AuthenticationContext';
import type { AuthenticationResult } from './AuthenticationTestHelpers';
import type { SessionData } from './Session';
import type { User } from './User';
import { AuthType, RegistrationStatus } from '../database/Types';
import { expand } from './Privileges';
import { getBlobUrl } from '../database/BlobStore';
import { securePasswordHash } from './Password';

import { PlaywrightHooks } from '../PlaywrightHooks';
import db, { tEvents, tRoles, tStorage, tTeams, tUsers, tUsersAuth, tUsersEvents }
    from '../database';

/**
 * Fetches authentication data for a particular user. Will be relayed to the frontend allowing them
 * to sign in to their account, preferably using passkeys.
 */
export interface AuthenticationData {
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
export async function authenticateUser(params: AuthenticateUserParams)
    : Promise<AuthenticationContext>
{
    if (PlaywrightHooks.isActive())
        return PlaywrightHooks.authenticateUser(params);

    const eventsJoin = tEvents.forUseInLeftJoin();
    const rolesJoin = tRoles.forUseInLeftJoin();
    const storageJoin = tStorage.forUseInLeftJoin();
    const teamsJoin = tTeams.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    const dbInstance = db;
    const authenticationBaseSelect = dbInstance.selectFrom(tUsers)
        .innerJoin(tUsersAuth)
            .on(tUsersAuth.userId.equals(tUsers.userId))
        .leftJoin(storageJoin)
            .on(storageJoin.fileId.equals(tUsers.avatarId))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.userId.equals(tUsers.userId))
            .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .leftJoin(eventsJoin)
            .on(eventsJoin.eventId.equals(usersEventsJoin.eventId))
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(usersEventsJoin.teamId))
        .leftJoin(rolesJoin)
            .on(rolesJoin.roleId.equals(usersEventsJoin.roleId))
        .groupBy(tUsers.userId)
        .select({
            // UserAuthenticationContext.authType:
            authType: tUsersAuth.authType,

            // UserAuthenticationContext.events:
            events: dbInstance.aggregateAsArray({
                event: eventsJoin.eventSlug,
                team: teamsJoin.teamEnvironment,

                // TODO: Figure out if we can do this filtering in the query somehow...
                isEventHidden: eventsJoin.eventHidden,
                isRoleAdmin: rolesJoin.roleAdminAccess,
            }),

            // UserAuthenticationContext.user:
            userId: tUsers.userId,
            username: tUsers.username,
            firstName: tUsers.firstName,
            lastName: tUsers.lastName,
            avatarFileHash: storageJoin.fileHash,
            privileges: tUsers.privileges,
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
                             .and(tUsersAuth.authValue.equals(securelyHashedPassword))
                        .or(tUsersAuth.authType.equals(AuthType.code)
                                .and(dbInstance.fragmentWithType('boolean', 'required').sql`
                                    SHA2(${tUsersAuth.authValue}, 256) =
                                         ${dbInstance.const(params.sha256Password, 'string')}`))
                    )
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

    const authenticationResult: AuthenticationResult | null = await authenticationQuery;
    if (!authenticationResult)
        return { user: /* visitor= */ undefined };

    const authType = authenticationResult.authType;
    const events: UserAuthenticationContext['events'] = new Map();
    const user: User = {
        userId: authenticationResult.userId,
        username: authenticationResult.username,
        firstName: authenticationResult.firstName,
        lastName: authenticationResult.lastName,
        avatarUrl:
            authenticationResult.avatarFileHash ? getBlobUrl(authenticationResult.avatarFileHash)
                                                : undefined,

        privileges: expand(authenticationResult.privileges),
    };

    for (const entry of authenticationResult.events) {
        if (!entry.event || !entry.team)
            continue;  // incomplete data

        if (entry.isEventHidden)
            continue;  // the event has been suspended

        if (!entry.isRoleAdmin)
            continue;  // role does not grant administrator access

        events.set(entry.event, {
            event: entry.event,
            team: entry.team,
        });
    }

    return { authType, events, user };
}

/**
 * Returns the current session token from the `user`. This is a value that's quite important to the
 * security of their account, so it won't be included in the regular User type.
 */
export async function getUserSessionToken(user: User | number): Promise<number | null> {
    return db.selectFrom(tUsers)
        .where(tUsers.userId.equals(typeof user === 'number' ? user : user.userId))
        .selectOneColumn(tUsers.sessionToken)
        .executeSelectNoneOrOne();
}

/**
 * Creates an account based on the given `data`. Will return a number indicating user ID when the
 * account was created successfully, or undefined. Failure only happens when the SQL queries fail.
 */
export async function createAccount(data: AccountCreationData): Promise<number | undefined> {
    let userId: number | undefined;

    const dbInstance = db;
    await dbInstance.transaction(async () => {
        const securelyHashedPassword = await securePasswordHash(data.password);

        userId = await dbInstance.insertInto(tUsers)
            .set({
                username: data.username,
                firstName: data.firstName,
                lastName: data.lastName,
                gender: data.gender,
                birthdate: new Date(data.birthdate),
                phoneNumber: data.phoneNumber,
            })
            .returningLastInsertedId()
            .executeInsert();

        await dbInstance.insertInto(tUsersAuth)
            .set({
                userId: userId,
                authType: AuthType.password,
                authValue: securelyHashedPassword,
            })
            .executeInsert();
    });

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
    if (PlaywrightHooks.isActive())
        return PlaywrightHooks.getAuthenticationData(username);

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
