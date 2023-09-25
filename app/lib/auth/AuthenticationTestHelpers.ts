// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { useMockConnection } from '@lib/database/Connection';
import { AuthType } from '../database/Types';

/**
 * Type that describes the result of the query executed by `authenticateUser`. Defined because there
 * are a series of tests that mock user authentication.
 */
export interface AuthenticationResult {
    // UserAuthenticationContext.authType:
    authType: AuthType,

    // UserAuthenticationContext.events:
    events: {
        event?: string;
        team?: string;

        isEventHidden?: number;
        isRoleAdmin?: number;
    }[],

    // UserAuthenticationContext.user:
    userId: number,
    username?: string,
    firstName: string,
    lastName: string,
    avatarFileHash?: string,
    privileges: bigint,
}

type MockConnection = ReturnType<typeof useMockConnection>;

/**
 * Expects an authentication query on the given `mockConnection`, to which we'll respond with the
 * `authenticationResult` when given. Default values will be used for all data.
 */
export function expectAuthenticationQuery(
    mockConnection: MockConnection, authenticationResult?: Partial<AuthenticationResult>): void
{
    mockConnection.expect('selectOneRow', (query: string, params: any[]): AuthenticationResult => ({
        // UserAuthenticationContext.authType:
        authType: AuthType.password,

        // UserAuthenticationContext.events:
        events: [],

        // UserAuthenticationContext.user:
        userId: 2000000,
        username: 'joe@example.com',
        firstName: 'Joe',
        lastName: 'Example',
        avatarFileHash: undefined,
        privileges: 0n,

        ...authenticationResult
    }));
}
