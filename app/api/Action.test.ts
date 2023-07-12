// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest } from 'next/server';
import { z } from 'zod';

import { type ActionProps, executeAction } from './Action';

describe('Action', () => {
    /**
     * Creates a NextRequest instance based on the given `body`, which will be stored as the request
     * body in a JSON-serialized representation.
     *
     * @param body The request body that should be included.
     * @param headers The headers to include with the request, if any.
     * @returns A NextRequest instance representing a POST request containing the given body.
     */
    function createRequest(body: any, headers?: Headers): NextRequest {
        return new class extends NextRequest {
            set url(value: string) { /* ignore */ }
        }('https://example.com/api', {
            method: 'POST',
            body: JSON.stringify(body),
            headers,
        });
    }

    it('is able to validate properties stored in the incoming request', async () => {
        const interfaceDefinition = z.object({
            request: z.object({
                first: z.string(),
                second: z.number().optional(),
            }),
            response: z.strictObject({ success: z.boolean() }),
        });

        type RequestType = z.infer<typeof interfaceDefinition>['request'];
        type ResponseType = z.infer<typeof interfaceDefinition>['response'];

        let invocationCounter = 0;

        async function MyAction(request: RequestType, props: ActionProps): Promise<ResponseType> {
            ++invocationCounter;

            return { success: true };
        }

        // Case 1: Valid requests are recognised as such.
        {
            const request = createRequest({ first: 'foo', second: 42 });
            const response = await executeAction(request, interfaceDefinition, MyAction);
            const responseBody = await response.json();

            expect(invocationCounter).toBe(1);
            expect(responseBody.success).toBeTruthy();
        }

        // Case 2: Optional parameters can be omitted.
        {
            const request = createRequest({ first: 'foo' });
            const response = await executeAction(request, interfaceDefinition, MyAction);
            const responseBody = await response.json();

            expect(invocationCounter).toBe(2);
            expect(responseBody.success).toBeTruthy();
        }

        // Case 3: Extra parameters will be ignored.
        {
            const request = createRequest({ first: 'foo', third: 'baz' });
            const response = await executeAction(request, interfaceDefinition, MyAction);
            const responseBody = await response.json();

            expect(invocationCounter).toBe(3);
            expect(responseBody.success).toBeTruthy();
        }

        // Case 4: Missing parameters will count as an error.
        {
            const request = createRequest({ second: 42 });
            const response = await executeAction(request, interfaceDefinition, MyAction);
            const responseBody = await response.json();

            expect(invocationCounter).toBe(3);
            expect(responseBody.success).toBeFalsy();
        }

        // Case 5: Parameters of an invalid type will count as an error.
        {
            const request = createRequest({ first: 42 });
            const response = await executeAction(request, interfaceDefinition, MyAction);
            const responseBody = await response.json();

            expect(invocationCounter).toBe(3);
            expect(responseBody.success).toBeFalsy();
        }
    });

    it('validates the action return value prior to sending it to the client', async () => {
        const interfaceDefinition = z.object({
            request: z.object({ /* no input necessary */ }),
            response: z.strictObject({
                first: z.string(),
                second: z.number().optional(),
            }),
        });

        type RequestType = z.infer<typeof interfaceDefinition>['request'];
        type ResponseType = z.infer<typeof interfaceDefinition>['response'];

        let invocationCounter = 0;
        let responseValue: any;

        async function MyAction(request: RequestType, props: ActionProps): Promise<ResponseType> {
            ++invocationCounter;
            return responseValue;
        }

        // Case 1: Valid responses are recognised as such.
        {
            responseValue = { first: 'hello!', second: 42 };

            const request = createRequest({ /* no payload */ });
            const response = await executeAction(request, interfaceDefinition, MyAction);
            const responseBody = await response.json();

            expect(invocationCounter).toBe(1);
            expect(responseBody.first).toEqual('hello!');
            expect(responseBody.second).toEqual(42);
        }

        // Case 2: Optional parameters can be omitted.
        {
            responseValue = { first: 'world!' };

            const request = createRequest({ /* no payload */ });
            const response = await executeAction(request, interfaceDefinition, MyAction);
            const responseBody = await response.json();

            expect(invocationCounter).toBe(2);
            expect(responseBody.first).toEqual('world!');
            expect(responseBody.second).toBeUndefined();
        }

        // Case 3: Extra parameters will be seen as an error.
        {
            responseValue = { first: 'foobar!', third: 'baz' };

            const request = createRequest({ /* no payload */ });
            const response = await executeAction(request, interfaceDefinition, MyAction);
            const responseBody = await response.json();

            expect(responseBody.success).toBeFalsy();
            expect(responseBody.error).toContain('Unrecognized key');

            expect(invocationCounter).toBe(3);
        }

        // Case 4: Missing parameters will be seen as an error.
        {
            responseValue = { second: 42 };

            const request = createRequest({ /* no payload */ });
            const response = await executeAction(request, interfaceDefinition, MyAction);
            const responseBody = await response.json();

            expect(responseBody.success).toBeFalsy();
            expect(responseBody.error).toContain('(response/first): Required');

            expect(invocationCounter).toBe(4);
        }

        // Case 5: Parameters of an invalid type will be seen as an error.
        {
            responseValue = { first: 42 };

            const request = createRequest({ /* no payload */ });
            const response = await executeAction(request, interfaceDefinition, MyAction);
            const responseBody = await response.json();

            expect(responseBody.success).toBeFalsy();
            expect(responseBody.error).toContain('(response/first): Expected string');

            expect(invocationCounter).toBe(5);
        }
    });

    it('is able to provide access to the request and response headers', async () => {
        const interfaceDefinition = z.object({
            request: z.object({ /* no input necessary */ }),
            response: z.object({ /* no response necessary */ }),
        });

        type RequestType = z.infer<typeof interfaceDefinition>['request'];
        type ResponseType = z.infer<typeof interfaceDefinition>['response'];

        let invocationCounter = 0;

        async function MyAction(request: RequestType, props: ActionProps): Promise<ResponseType> {
            ++invocationCounter;

            const { requestHeaders, responseHeaders } = props;

            responseHeaders.set('X-Third', 'header');

            for (const [ name, value ] of requestHeaders.entries())
                responseHeaders.set(name, 'says ' + value);

            return { /* empty response */ };
        }

        const requestHeaders = new Headers([
            [ 'X-First', '1' ],
            [ 'X-Second', 'banana' ],
        ]);

        const request = createRequest({ /* no payload */ }, requestHeaders);
        const response = await executeAction(request, interfaceDefinition, MyAction);
        const responseBody = await response.json();

        expect(invocationCounter).toEqual(1);
        expect(responseBody).toEqual({ /* empty response */ });
        expect(response.headers.get('X-First')).toEqual('says 1');
        expect(response.headers.get('X-Second')).toEqual('says banana');
        expect(response.headers.get('X-Third')).toEqual('header');
    });
});