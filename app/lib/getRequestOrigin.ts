// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { headers } from 'next/headers';

/**
 * Utility function to retrieve the current origin in a server component. This is provided as a work
 * around to the request information not being available in server components, and is implemented by
 * setting an internal HTTP header in our middleware.
 */
export function getRequestOrigin() {
    return headers().get('X-Request-Origin') || 'animecon.team';
}
