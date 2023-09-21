// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '@app/api/Action';

import { getOutbox, kGetOutboxDefinition } from '../getOutbox';
import { listOutbox, kListOutboxDefinition } from '../listOutbox';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { id: string[]; } };

/**
 * GET /api/admin/outbox
 * GET /api/admin/outbox/:id
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (Object.hasOwn(params, 'id'))
        return executeAction(request, kGetOutboxDefinition, getOutbox, params);

    return executeAction(request, kListOutboxDefinition, listOutbox);
}

/**
 * POST /api/admin/outbox
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (!Object.hasOwn(params, 'id'))
        return executeAction(request, kListOutboxDefinition, listOutbox);

    return NextResponse.json({ success: false }, { status: 404 });
}
