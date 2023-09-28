// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { isNotFoundError } from 'next/dist/client/components/not-found';

import { Privilege } from './Privileges';
import { type SessionData, kSessionCookieName, sealSession } from './Session';
import { executeAccessCheck, getAuthenticationContextFromHeaders } from './AuthenticationContext';
import { buildAuthenticationContext, expectAuthenticationQuery } from './AuthenticationTestHelpers';
import { serialize } from 'cookie';
import { useMockConnection } from '../database/Connection';

import { TextDecoder, TextEncoder } from 'util';

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

describe('AuthenticationContext', () => {
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
        expectAuthenticationQuery(mockConnection);

        const { user } = await getAuthenticationContextFromHeaders(headers);
        expect(user).not.toBeUndefined();

        expect(user?.firstName).toEqual('Joe');
        expect(user?.lastName).toEqual('Example');
    });

    it('is able to execute dedicated access checks: "admin"', async () => {
        // Case (1): Visitors are never administrators
        const visitorAuthenticationContext = { user: undefined };
        try {
            executeAccessCheck(visitorAuthenticationContext, { check: 'admin' });
            fail('executeAccessCheck was expected to throw');
        } catch (error: any) {
            expect(isNotFoundError(error)).toBeTrue();
        }

        // Case (2): Explicit administrators through a privilege
        const explicitAdminAuthenticationContext = buildAuthenticationContext({
            user: {
                privileges: BigInt(Privilege.EventAdministrator),
            },
        });

        executeAccessCheck(explicitAdminAuthenticationContext, { check: 'admin' });

        // Case (3): Implicit administrators through a role assignment
        const implicitAdminAuthenticationContext = buildAuthenticationContext({
            events: new Map([
                [ '2024', { event: '2024', team: 'stewards.team' }],
            ]),
        });

        executeAccessCheck(implicitAdminAuthenticationContext, { check: 'admin' });

        // Case (4): Users without either are not administrators
        const userAuthenticationContext = buildAuthenticationContext();
        try {
            executeAccessCheck(userAuthenticationContext, { check: 'admin' });
            fail('executeAccessCheck was expected to throw');
        } catch (error: any) {
            expect(isNotFoundError(error)).toBeTrue();
        }
    });

    it('is able to execute dedicated access checks: "admin-event"', async () => {
        // Case (1): Visitors are never administrators
        const visitorAuthenticationContext = { user: undefined };
        try {
            executeAccessCheck(visitorAuthenticationContext, { check: 'admin-event', event: 'XX' });
            fail('executeAccessCheck was expected to throw');
        } catch (error: any) {
            expect(isNotFoundError(error)).toBeTrue();
        }

        // Case (2): Explicit administrators through a privilege
        const explicitAdminAuthenticationContext = buildAuthenticationContext({
            user: {
                privileges: BigInt(Privilege.EventAdministrator),
            },
        });

        executeAccessCheck(
            explicitAdminAuthenticationContext, { check: 'admin-event', event: '2024' });

        // Case (3): Implicit administrators through a role assignment to the applicable event
        const implicitAdminAuthenticationContext = buildAuthenticationContext({
            events: new Map([
                [ '2024', { event: '2024', team: 'stewards.team' }],
            ]),
        });

        executeAccessCheck(
            implicitAdminAuthenticationContext, { check: 'admin-event', event: '2024' });

        // Case (4): No administrator access when there is no assignment for the applicable event
        const wrongEventAuthenticationContext = buildAuthenticationContext({
            events: new Map([
                [ '2017', { event: '2017', team: 'hosts.team' }],
            ]),
        });

        try {
            executeAccessCheck(
                wrongEventAuthenticationContext, { check: 'admin-event', event: '2024' });

            fail('executeAccessCheck was expected to throw');
        } catch (error: any) {
            expect(isNotFoundError(error)).toBeTrue();
        }

        // Case (5): Users without either are not administrators
        const userAuthenticationContext = buildAuthenticationContext();
        try {
            executeAccessCheck(userAuthenticationContext, { check: 'admin-event', event: '2024' });
            fail('executeAccessCheck was expected to throw');
        } catch (error: any) {
            expect(isNotFoundError(error)).toBeTrue();
        }
    });

    it('is able to execute privilege-based access checks, including OR and AND sets', async () => {
        const authenticationContext = buildAuthenticationContext({
            user: {
                privileges: BigInt(Privilege.EventHotelManagement),
            }
        });

        // Pass:
        executeAccessCheck(authenticationContext, { privilege: Privilege.EventHotelManagement });

        // Fail:
        try {
            executeAccessCheck(authenticationContext, { privilege: Privilege.SystemAiAccess });
            fail('executeAccessCheck was expected to throw');
        } catch (error: any) {
            expect(isNotFoundError(error)).toBeTrue();
        }

        // TODO: and()
        // TODO: or()
    });
});
