// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { CreateContentDefinition } from '@app/api/admin/content/createContent';
import type { CreateEventDefinition } from '@app/api/admin/createEvent';
import type { DeleteContentDefinition } from '@app/api/admin/content/deleteContent';
import type { ApplicationDefinition } from '@app/api/event/application';
import type { HotelsDefinition } from '@app/api/event/hotels';
import type { ListContentDefinition } from '@app/api/admin/content/listContent';

/**
 * Type helpers for deciding on the request and response types for API definitions. Because they are
 * generic zod objects without a base class, we infer typing rather than define it.
 */
type ApiRequestType<T> = T extends { request: object } ? T['request'] : never;
type ApiResponseType<T> = T extends { response: object } ? T['response'] : void;

/**
 * Mapping of the API endpoints that are available, with the request method and type information
 * associated with that. This enables significant simplication of the `callApi` method.
 */
type ApiEndpoints = {
    'get': {
        '/api/admin/content': ListContentDefinition,
    },
    'post': {
        '/api/admin/content': CreateContentDefinition,
        '/api/admin/create-event': CreateEventDefinition,
        '/api/events/application': ApplicationDefinition,
        '/api/events/hotels': HotelsDefinition,
    },
    'delete': {
        '/api/admin/content/:id': DeleteContentDefinition,
    },
    'put': {},
};

/**
 * The `fetch` function that should be used by the `callApi` machinery. Can be overridden for tests.
 */
let globalFetch = globalThis.fetch;

/**
 * Writes the `value` at the given `path` to the `searchParams`. This allows the `callApi()` method
 * to support input parameters to GET requests seamlessly.
 */
function writeToSearchParams(searchParams: URLSearchParams, value: any, path: string[]) {
    if (Array.isArray(value))
        throw new Error('Support for arrays has not been implemented yet');

    if (typeof value === 'object') {
        for (const [ childKey, childValue ] of Object.entries(value))
            writeToSearchParams(searchParams, childValue, [ ...path, childKey ]);

        return;
    }

    searchParams.set(path.join('.'), `${value}`);
}

/**
 * The `callApi` method is the Volunteer Manager's canonical mechanism for making REST API calls. It
 * is automatically typed based on predefined mappings for both request and response parameters. The
 * function will throw an error when a network error occurs, or an API call cannot be completed for
 * other reasons. (Including server errors.)
 *
 * @example
 * ```
 * callApi('get', '/api/event/hotel', { eventSlug: '2024' });
 * callApi('delete', '/api/admin/content/:id', { id: 42, scope: { ... } });
 * ```
 */
export async function callApi<Method extends keyof ApiEndpoints,
                              Endpoint extends keyof ApiEndpoints[Method] & string>(
    method: Method,
    endpoint: Endpoint,
    request: ApiRequestType<ApiEndpoints[Method][Endpoint]>)
        : Promise<ApiResponseType<ApiEndpoints[Method][Endpoint]>>
{
    // (1) Replace placeholders in the endpoint with members included in the request.
    const consumedProperties = new Set<string>();
    const completedEndpoint = endpoint.replace(/:(\w+)/g, (_, placeholder) => {
        if (!Object.hasOwn(request, placeholder))
            throw new Error(`Endpoint placeholder doesn't exist in the request: ":${placeholder}"`);

        consumedProperties.add(placeholder);

        const value = (request as any)[placeholder];
        switch (typeof value) {
            case 'number':
            case 'string':
                return `${value}`;

            default:
                throw new Error(`Endpoint placeholders must be scalars (found ${typeof value})`);
        }
    });

    // (2) Remove the `consumedProperties` from the `request` object, to not transmit them twice.
    for (const consumedProperty of consumedProperties)
        delete (request as any)[consumedProperty];

    // (3) Compose the actual request endpoint, headers and payload.
    let requestEndpoint: string = completedEndpoint;
    let requestHeaders: Record<string, string> | undefined;
    let requestPayload: string | undefined;

    if (method === 'get') {
        const searchParams = new URLSearchParams();
        writeToSearchParams(searchParams, request, [ /* empty path */ ]);
        requestEndpoint += `?${searchParams.toString()}`;
    } else {
        requestHeaders = { 'Content-Type': 'application/json' };
        requestPayload = JSON.stringify(request);
    }

    // (4) Issue the request to the server with the composed information.
    const response = await globalFetch(requestEndpoint, {
        method: method.toUpperCase(),
        headers: requestHeaders,
        body: requestPayload,
    });

    if (!response.ok)
        throw new Error(`The server responded with HTTP ${response.status} status code.`);

    return await response.json();
}

/**
 * Injects the given `fetch` function to the `callApi` infrastructure. When a value is given, that
 * function will be called instead of the real `fetch`. Without a value, state will be reset.
 */
export function injectFetch(fetch?: typeof globalThis.fetch): void {
    globalFetch = fetch ?? globalThis.fetch;
}
