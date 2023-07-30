// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '../../Action';

import { application, kApplicationDefinition } from '../application';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { path: string[] } };

/**
 * The /api/event endpoint exposes APIs related to a particular event such as participation
 * applications and modifications, feedback reports, and so on.
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<Response> {
    const action = Object.hasOwn(params, 'path') ? params.path.join('/') : null;
    switch (action) {
        case 'application':
            return executeAction(request, kApplicationDefinition, application);
    }

    return NextResponse.json({ success: false }, { status: 404 });
}
