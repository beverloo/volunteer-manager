// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { WhatsAppClient } from './WhatsAppClient';
import { composeVolunteerApplicationRequest } from './templates/VolunteerApplication';
import { useMockConnection } from '@lib/database/Connection';

import { kMessageRequest } from './WhatsAppTypes';

describe('WhatsAppClient', () => {
    const mockConnection = useMockConnection();

    // Access token to use instead of real information when testing.
    const kTestAccessToken = 'my-access-token';

    // Phone number ID to use instead of real information when testing.
    const kTestPhoneNumberId = '1234567890';

    // Creates a fetch handler with the given `handler`, adhering to the `fetch()` signature.
    function createFetchHandler(handler: (url: string, init: RequestInit) => [ number, object ]) {
        return async (url: RequestInfo | URL, init?: RequestInit) => {
            if (typeof url !== 'string' || typeof init !== 'object')
                throw new Error('Only the fetch(string, object) signature is supported.');

            const [ status, response ] = handler(url, init);
            return new Response(JSON.stringify(response), { status });
        };
    }

    it('is able to validate all our templates', () => {
        const volunteerApplicationRequest = composeVolunteerApplicationRequest({
            to: '+3100000000',
            firstName: 'John',
            lastName: 'Doe',
            eventSlug: '2024',
            teamName: 'Stewards',
            teamSlug: 'stewards.team'
        });

        expect(() => kMessageRequest.parse(volunteerApplicationRequest)).not.toThrow();
    });

    it('is able to send messages and store them in the database', async () => {
        mockConnection.expect('insertReturningLastInsertedId', (query, params) => {
            expect(params).toHaveLength(3);
            expect(params[0]).toBe(/* recipientUserId= */ 29);
            expect(params[1]).toBe('+4400000000');
            expect(params[2].length).toBeGreaterThan(128);

            return /* insertId= */ 145;
        });

        mockConnection.expect('update', (query, params) => {
            expect(params).toHaveLength(6);
            expect(params[0]).toBeNull();
            expect(params[1]).toBeNull();
            expect(params[2]).toBeNull();
            expect(params[3]).toBeNull();

            expect(params[4]).toBeGreaterThan(/* time= */ 0);
            expect(params[5]).toBe(/* insertId= */ 145);
        });

        const client = new WhatsAppClient({
            accessToken: kTestAccessToken,
            phoneNumberId: kTestPhoneNumberId,
        }, createFetchHandler((url, init) => {
            expect(url).toContain(kTestPhoneNumberId);
            expect(init.headers?.toString()).toContain(kTestAccessToken);

            return [ 200, { foo: 'bar' } ]
        }));

        const message = composeVolunteerApplicationRequest({
            to: '+4400000000',
            firstName: 'John',
            lastName: 'Doe',
            eventSlug: '2024',
            teamName: 'Stewards',
            teamSlug: 'stewards.team'
        });

        const response = await client.sendMessage(/* recipientUserId= */ 29, message);
        expect(response).toBeTrue();
    });

    it('is able to detect non-OK response codes from the API endpoint', async () => {
        mockConnection.expect('insertReturningLastInsertedId', () => /* insertId= */ 123);
        mockConnection.expect('update', (query, params) => {
            expect(params).toHaveLength(6);
            // TODO: Non-OK response code logging
        });

        const client = new WhatsAppClient({
            accessToken: kTestAccessToken,
            phoneNumberId: kTestPhoneNumberId,
        }, createFetchHandler((url, init) => [ 404, { /* empty response */ } ]));

        const message = composeVolunteerApplicationRequest({
            to: '+4400000000',
            firstName: 'John',
            lastName: 'Doe',
            eventSlug: '2024',
            teamName: 'Stewards',
            teamSlug: 'stewards.team'
        });

        const response = await client.sendMessage(/* recipientUserId= */ 29, message);
        expect(response).toBeFalse();
    });

    it('is able to detect non-validating responses from the API endpoint', async () => {
        mockConnection.expect('insertReturningLastInsertedId', () => /* insertId= */ 123);
        mockConnection.expect('update', (query, params) => {
            expect(params).toHaveLength(6);
            // TODO: Non-validating response handling
        });

        const client = new WhatsAppClient({
            accessToken: kTestAccessToken,
            phoneNumberId: kTestPhoneNumberId,
        }, createFetchHandler((url, init) => [ 200, { /* incomplete response */ } ]));

        const message = composeVolunteerApplicationRequest({
            to: '+4400000000',
            firstName: 'John',
            lastName: 'Doe',
            eventSlug: '2024',
            teamName: 'Stewards',
            teamSlug: 'stewards.team'
        });

        const response = await client.sendMessage(/* recipientUserId= */ 29, message);
        expect(response).toBeFalse();
    });

    it('is able to catch exceptions and store them in the database', async () => {
        mockConnection.expect('insertReturningLastInsertedId', (query, params) => {
            expect(params).toHaveLength(3);
            expect(params[0]).toBe(/* recipientUserId= */ 42);
            expect(params[1]).toBe('+3100000000');
            expect(params[2].length).toBeGreaterThan(128);

            return /* insertId= */ 123;
        });

        mockConnection.expect('update', (query, params) => {
            expect(params).toHaveLength(6);
            expect(params[0]).toBe(/* errorName= */ 'Error');
            expect(params[1]).toBe(/* errorMessage= */ 'Something went wrong');
            expect(params[2]).not.toBeNull();
            expect(params[3]).toBeNull();

            expect(params[4]).toBeGreaterThan(/* time= */ 0);
            expect(params[5]).toBe(/* insertId= */ 123);
        });

        const client = new WhatsAppClient({
            accessToken: kTestAccessToken,
            phoneNumberId: kTestPhoneNumberId,
        }, createFetchHandler((url, init) => {
            throw new Error('Something went wrong');
        }));

        const message = composeVolunteerApplicationRequest({
            to: '+3100000000',
            firstName: 'John',
            lastName: 'Doe',
            eventSlug: '2024',
            teamName: 'Stewards',
            teamSlug: 'stewards.team'
        });

        const response = await client.sendMessage(/* recipientUserId= */ 42, message);
        expect(response).toBeFalse();
    });
});
