// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { UserDatabaseRow } from './User';
import { AuthType } from '@app/lib/database/Types';
import { type SessionData, kSessionCookieName, sealSession } from './Session';
import { getUserFromHeaders } from './getUser';
import { serialize } from 'cookie';
import { useMockConnection } from '../database/Connection';

import { TextDecoder, TextEncoder } from 'util';

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

describe('getUser', () => {
    const mockConnection = useMockConnection();

    it('is able to authenticate users based on valid session data', async () => {
        const sessionData: SessionData = {
            id: 42,
            token: 9001,
        };

        const sealedSession = await sealSession(sessionData);
        expect(sealedSession.length).toBeGreaterThan(0);

        const sealedCookie = serialize(kSessionCookieName, sealedSession, { httpOnly: true });
        expect(sealedCookie.length).toBeGreaterThan(0);

        const headers = new Headers([ ['Cookie', sealedCookie ] ]);
        expect(headers.has('Cookie')).toBeTruthy();

        // Intercepts the authentication SQL query that will be fired in order to validate the
        // information contained within the `sessionData`. Validate the parameters, otherwise pass.
        mockConnection.expect('selectOneRow', (query: string, params: any[]): UserDatabaseRow => {
            return {
                userId: sessionData.id,
                username: 'joe@example.com',
                firstName: 'Joe',
                lastName: 'Example',
                gender: 'Male',
                birthdate: new Date('2023-07-12'),
                phoneNumber: '+440000000000',
                avatarFileHash: undefined,
                privileges: 0n,
                activated: 1,
                sessionToken: sessionData.token,

                // Internal use in `authenticateUser`:
                authType: AuthType.password,
            };
        });

        const user = await getUserFromHeaders(headers);
        expect(user).not.toBeUndefined();

        expect(user?.firstName).toEqual('Joe');
        expect(user?.lastName).toEqual('Example');
    });
});
