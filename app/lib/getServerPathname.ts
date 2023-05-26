// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { headers } from 'next/headers';

/**
 * Name of the internal HTTP header through which the pathname will be communicated.
 */
export const kServerPathnameHeader = 'X-Request-Path';

/**
 * Utility function to retrieve the current path in a server component. This is provided as a work-
 * around to the usePathname() not being available in NextJS for server components, and is
 * is implemented by setting an internal HTTP header in our middleware.
 */
export function getServerPathname() {
    return headers().get(kServerPathnameHeader) || '/';
}
