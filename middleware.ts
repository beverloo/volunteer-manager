// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';

/**
 * Server components in NodeJS aren't given the ability to access any information about the incoming
 * request, including the origin and path of the content that's being served. Since the volunteer
 * manager supports multiple environments, we need to be able to extract this information.
 */
export async function middleware(request: NextRequest) {
    // TODO: Remove the following once there is a mechanism for server components to retrieve the
    // current URL and/or pathname. This is currently blocked by the following issue:
    // https://github.com/vercel/next.js/issues/43704

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-Request-Origin', request.nextUrl.hostname);
    requestHeaders.set('X-Request-Path', request.nextUrl.pathname);

    return NextResponse.next({ request: { headers: requestHeaders } });
}
