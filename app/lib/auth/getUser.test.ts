// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type DatabasePrimitive, DatabaseTestingDelegate, kDatabase } from '../database/Database';
import { type SessionData, kSessionCookieName, sealSession } from './Session';
import { type UserDatabaseRow } from './User';
import { Result } from '../database/Result';
import { getUserFromHeaders } from './getUser';
import { serialize } from 'cookie';

import { TextDecoder, TextEncoder } from 'util';

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

describe('getUser', () => {
    // Note that we skip testing the `getUser` and `requireUser` methods because they contain the
    // same logic as `getUserFromHeaders`, with the difference that they source the session cookie
    // from a different place and behave differently when no user exists. These are core NextJS
    // primitives, so let's boldly assume that they don't randomly break underneath us.

    afterEach(() => kDatabase.setDelegateForTesting(/* delegate= */ undefined));

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
        kDatabase.setDelegateForTesting(new class implements DatabaseTestingDelegate {
            async query(query: string, parameters?: DatabasePrimitive[]): Promise<Result> {
                expect(parameters).not.toBeUndefined();
                expect(parameters).toBeInstanceOf(Array);

                expect(parameters).toHaveLength(2);
                expect(parameters![0]).toEqual(sessionData.id);
                expect(parameters![1]).toEqual(sessionData.token);

                return Result.createSelectForTesting<UserDatabaseRow>([{
                    user_id: sessionData.id,
                    username: 'joe@example.com',
                    first_name: 'Joe',
                    last_name: 'Example',
                    gender: 'Male',
                    birthdate: '2023-07-12',
                    phone_number: '+440000000000',
                    privileges: 0,
                    session_token: sessionData.token,
                }]);
            }
        });

        const user = await getUserFromHeaders(headers);
        expect(user).not.toBeUndefined();

        expect(user?.firstName).toEqual('Joe');
        expect(user?.lastName).toEqual('Example');
    });
});
