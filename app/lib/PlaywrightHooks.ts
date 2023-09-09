// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { AuthenticationData, AuthenticateUserParams } from './auth/Authentication';
import { AuthType } from './database/Types';
import { User, type UserDatabaseRow } from './auth/User';

/**
 * The users that exist when running Playwright
 */
const kPlaywrightUsers: Partial<UserDatabaseRow & { password: string }>[] = [
    {
        userId: 1000000,
        username: 'playwright@animecon.nl',
        password: '7827e8eb2cb3b95f4d0ffac324b65208ff813b66884d08327ab0abb04fe780fb',  // playwright
        firstName: 'PWUSER',
        activated: 1,
    },
    {
        userId: 1000003,
        username: 'playwright-access-code@animecon.nl',
        password: 'cccd34d95dc5294d17177274e6a7b25a569fda7d823f2aa59ba63dfba9f8e013',  // 8765
        activated: 1,
        authType: AuthType.code,
    },
    {
        userId: 1000002,
        username: 'playwright-unactivated@animecon.nl',
        password: '7827e8eb2cb3b95f4d0ffac324b65208ff813b66884d08327ab0abb04fe780fb',  // playwright
        activated: 0,
    }
];

/**
 * Hooks that can be provided throughout the Volunteer Manager in support of Playground tests.
 */
export class PlaywrightHooks {
    /**
     * Returns whether the Volunteer Manager is currently running Playwright tests. This will be
     * determined by the `APP_RUNNING_PLAYWRIGHT_TEST` environment variable.
     */
    static isActive(): boolean {
        return !!process.env.APP_RUNNING_PLAYWRIGHT_TEST;
    }

    /**
     * Hook for `authenticateUser` in `//app/lib/auth/Authentication.ts`.
     */
    static authenticateUser(params: AuthenticateUserParams): User | undefined {
        for (const playwrightUser of kPlaywrightUsers) {
            let match = false;
            switch (params.type) {
                case 'password':
                    match = playwrightUser.username === params.username.toLocaleLowerCase() &&
                            playwrightUser.password === params.sha256Password.toLocaleLowerCase();
                    break;
                case 'session':
                    match = playwrightUser.userId === params.id;  // TODO: verify `token`?
                    break;
                case 'userId':
                    match = playwrightUser.userId === params.userId;
                    break;
            }

            if (!match)
                continue;

            return new User({
                userId: 999999,
                username: undefined,
                firstName: 'PWUSER',
                lastName: 'Example',
                gender: 'Other',
                birthdate: undefined,
                phoneNumber: undefined,
                avatarFileHash: undefined,
                privileges: 0n,
                activated: 1,
                sessionToken: 0,
                events: [],

                ...playwrightUser,  // expand the partial user configuration

            }, playwrightUser.authType ?? AuthType.password);
        }

        return undefined;
    }

    /**
     * Hook for `getAuthenticationData` in `//app/lib/auth/Authentication.ts`.
     */
    static getAuthenticationData(username: string): AuthenticationData | undefined {
        for (const playwrightUser of kPlaywrightUsers) {
            if (playwrightUser.username !== username)
                continue;

            return { activated: !!playwrightUser.activated };
        }

        return undefined;
    }

    /**
     * Hook for `Log` in `//app/lib/Log.ts`.
     */
    static isPlaywrightUser(sourceUserId: number | null, targetUserId: number | null) {
        for (const playwrightUser of kPlaywrightUsers) {
            if (playwrightUser.userId === sourceUserId || playwrightUser.userId === targetUserId)
                return true;
        }

        return false;
    }
}