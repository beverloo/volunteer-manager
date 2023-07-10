// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { type ActionProps, executeAction } from './Action';

describe('Action', () => {
    /**
     * Creates a NextRequest instance based on the given `body`, which will be stored as the request
     * body in a JSON-serialized representation.
     *
     * @param body The request body that should be included.
     * @returns A NextRequest instance representing a POST request containing the given body.
     */
    function createRequest(body: any): NextRequest {
        return new class extends NextRequest {
            set url(value: string) { /* ignore */ }
        }('https://example.com/api', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    it('is able to validate properties stored in the incoming request', async () => {
        let invocationCounter = 0;

        const interfaceDefinition = z.object({
            request: z.object({
                first: z.string(),
                second: z.number().optional(),
            }),
            response: z.object({ success: z.boolean() }),
        });

        type RequestType = z.infer<typeof interfaceDefinition>['request'];
        type ResponseType = z.infer<typeof interfaceDefinition>['response'];

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
});
