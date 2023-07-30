// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

type ServerCallDefinition = { request: object; response: object; };

/**
 * Issues a call to the server at the given `endpoint` with the given `request` information. When
 * successful, will return an object conforming to the response type, or otherwise throw an Error
 * that should be caught by the user interface.
 *
 * @param endpoint The endpoint to which the call should be made.
 * @param request Request information that should be included in the request.
 * @returns Response from the server, unverified but assumed to be correct for now.
 */
export async function issueServerAction<T extends ServerCallDefinition>(
    endpoint: string, request: T['request'])
        : Promise<T['response']>
{
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });

        return await response.json();

    } catch {
        throw new Error('The server ran into an issue, please try again later.');
    }
}
