// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Environment } from '../Environment';
import { getRequestOrigin } from './getRequestOrigin';

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
