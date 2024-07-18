// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { isNotFoundError } from 'next/dist/client/components/not-found';

import { AccessControl } from './AccessControl';
import { Privilege } from './Privileges';
import { type SessionData, kSessionCookieName, sealSession } from './Session';
import { executeAccessCheck, or, and, getAuthenticationContextFromHeaders } from './AuthenticationContext';
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

    it('is able to execute dedicated access checks: "admin"', () => {
        // Case (1): Visitors are never administrators
        const visitorAuthenticationContext = { access: new AccessControl({}), user: undefined };
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
                [ '2024', { admin: true, event: '2024', team: 'stewards.team' }],
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

    it.failing('is able to execute dedicated access checks: "admin-event"', () => {
        // Case (1): Visitors are never administrators
        const visitorAuthenticationContext = { access: new AccessControl({}), user: undefined };
        try {
            executeAccessCheck(visitorAuthenticationContext, { check: 'admin-event', event: 'XX' });
            fail('executeAccessCheck was expected to throw');
        } catch (error: any) {
            expect(isNotFoundError(error)).toBeTrue();
        }

        // Case (2): Explicit administrators through a privilege
        const explicitAdminAuthenticationContext = buildAuthenticationContext({
            access: {
                grants: 'event.visible',
                events: '2024',
            },
        });

        executeAccessCheck(
            explicitAdminAuthenticationContext, { check: 'admin-event', event: '2024' });

        // Case (3): Implicit administrators through a role assignment to the applicable event
        const implicitAdminAuthenticationContext = buildAuthenticationContext({
            events: new Map([
                [ '2024', { admin: true, event: '2024', team: 'stewards.team' }],
            ]),
        });

        executeAccessCheck(
            implicitAdminAuthenticationContext, { check: 'admin-event', event: '2024' });

        // Case (4): Participation in an event does not equate being granted access.
        const participationAuthenticationContext = buildAuthenticationContext({
            events: new Map([
                [ '2024', { admin:  /* ----> */ false, event: '2024', team: 'stewards.team' }],
            ]),
        });

        try {
            executeAccessCheck(
                participationAuthenticationContext, { check: 'admin-event', event: '2024' });

            fail('executeAccessCheck was expected to throw');
        } catch (error: any) {
            expect(isNotFoundError(error)).toBeTrue();
        }

        // Case (5): No administrator access when there is no assignment for the applicable event
        const wrongEventAuthenticationContext = buildAuthenticationContext({
            events: new Map([
                [ '2017', { admin: true, event: '2017', team: 'hosts.team' }],
            ]),
        });

        try {
            executeAccessCheck(
                wrongEventAuthenticationContext, { check: 'admin-event', event: '2024' });

            fail('executeAccessCheck was expected to throw');
        } catch (error: any) {
            expect(isNotFoundError(error)).toBeTrue();
        }

        // Case (6): Users without either are not administrators
        const userAuthenticationContext = buildAuthenticationContext();
        try {
            executeAccessCheck(userAuthenticationContext, { check: 'admin-event', event: '2024' });
            fail('executeAccessCheck was expected to throw');
        } catch (error: any) {
            expect(isNotFoundError(error)).toBeTrue();
        }
    });

    it('is able to execute dedicated access checks: "event"', () => {
        // Case (1): Visitors are never granted access
        const visitorAuthenticationContext = buildAuthenticationContext();
        try {
            executeAccessCheck(visitorAuthenticationContext, { check: 'event', event: '2025' });
            fail('executeAccessCheck was expected to throw');
        } catch (error: any) {
            expect(isNotFoundError(error)).toBeTrue();
        }

        // Case (2): Participants are granted access (w/o administrator access):
        const participantAuthenticationContext = buildAuthenticationContext({
            events: new Map([
                [ '2025', { admin: /** ----> **/ false, event: '2025', team: 'hosts.team' }],
            ]),
        });

        executeAccessCheck(participantAuthenticationContext, { check: 'event', event: '2025' });

        // Case (3): Participants are granted access (w/ administrator access):
        const administratorAuthenticationContext = buildAuthenticationContext({
            events: new Map([
                [ '2025', { admin: /** ----> **/ true, event: '2025', team: 'hosts.team' }],
            ]),
        });

        executeAccessCheck(administratorAuthenticationContext, { check: 'event', event: '2025' });

        // Case (4): People with the schedule override permission always have access:
        const privilegedAuthenticationContext = buildAuthenticationContext({
            user: {
                privileges: BigInt(Privilege.EventScheduleOverride),
            }
        });

        executeAccessCheck(privilegedAuthenticationContext, { check: 'event', event: '2025' });
    });

    it('is able to execute privilege-based access checks, including OR and AND sets', () => {
        const authenticationContext = buildAuthenticationContext({
            user: {
                privileges: BigInt(Privilege.EventHotelManagement),
            }
        });

        // Pass:
        executeAccessCheck(authenticationContext, { privilege: 0n as any as Privilege });
        executeAccessCheck(authenticationContext, { privilege: Privilege.EventHotelManagement });
        executeAccessCheck(authenticationContext, {
            privilege: or(Privilege.EventHotelManagement, Privilege.Statistics),
        });

        // Fail:
        try {
            executeAccessCheck(authenticationContext, { privilege: Privilege.SystemOutboxAccess });
            fail('executeAccessCheck was expected to throw');
        } catch (error: any) {
            expect(isNotFoundError(error)).toBeTrue();
        }

        try {
            executeAccessCheck(authenticationContext, {
                privilege: and(Privilege.EventHotelManagement, Privilege.Statistics),
            });
            fail('executeAccessCheck was expected to throw');
        } catch (error: any) {
            expect(isNotFoundError(error)).toBeTrue();
        }
    });
});
