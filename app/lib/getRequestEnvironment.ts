// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { headers } from 'next/headers';

import type { Environment } from '../Environment';

/**
 * Utility function to retrieve the current origin in a server component. This is provided as a work
 * around to the request information not being available in server components, and is implemented by
 * setting an internal HTTP header in our middleware.
 */
export function getRequestOrigin() {
    const localHeaders = headers();
    return localHeaders.get('Host') || localHeaders.get('X-Request-Origin') || 'animecon.team';
}

/**
 * Utility function to retrieve the current environment in a server component. This uses the
 * `getRequestOrigin` method under the hood, but validates the input and provides a default.
 */
export function getRequestEnvironment(): Environment {
    const hostname = getRequestOrigin();

    if (hostname.endsWith('animecon.team'))
        return 'animecon.team';
    if (hostname.endsWith('gophers.team'))
        return 'gophers.team';
    if (hostname.endsWith('hosts.team'))
        return 'hosts.team';
    if (hostname.endsWith('stewards.team'))
        return 'stewards.team';

    // FIXME: Default to animecon.team?
    return 'stewards.team';
}
