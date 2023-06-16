// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Environment } from '../Environment';
import { getRequestOrigin } from './getRequestOrigin';

/**
 * Utility function to retrieve the current environment in a server component. This uses the
 * `getRequestOrigin` method under the hood, but validates the input and provides a default.
 */
export function getRequestEnvironment(): Environment {
    const hostname = getRequestOrigin();

    switch (hostname) {
        case 'animecon.team':
        case 'gophers.team':
        case 'hosts.team':
        case 'stewards.team':
            return hostname;

        default:
            // FIXME: Default to animecon.team?
            return 'stewards.team';
    }
}
