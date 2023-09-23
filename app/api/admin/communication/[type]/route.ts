// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '@app/api/Action';

import { createMessage, kCreateMessageDefinition } from '../createMessage';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { id: string[] } };

/**
 * GET /api/admin/communication/:type
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<Response> {
    return executeAction(request, kCreateMessageDefinition, createMessage, params);
}

/**
 * POST /api/admin/communication/:type
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<Response> {
    // TODO...
    return NextResponse.json({ success: false }, { status: 404 });
}
