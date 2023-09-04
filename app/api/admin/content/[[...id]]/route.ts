// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '@app/api/Action';

import { createContent, kCreateContentDefinition } from '../createContent';
import { deleteContent, kDeleteContentDefinition } from '../deleteContent';
import { getContent, kGetContentDefinition } from '../getContent';
import { listContent, kListContentDefinition } from '../listContent';
import { updateContent, kUpdateContentDefinition } from '../updateContent';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { id: string[] } };

/**
 * DELETE /api/content/:id
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (Object.hasOwn(params, 'id'))
        return executeAction(request, kDeleteContentDefinition, deleteContent, params);

    return NextResponse.json({ success: false }, { status: 404 });
}

/**
 * GET /api/content/
 * GET /api/content/:id
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (!Object.hasOwn(params, 'id'))
        return executeAction(request, kListContentDefinition, listContent);

    return executeAction(request, kGetContentDefinition, getContent, params);
}

/**
 * POST /api/content
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (!Object.hasOwn(params, 'id'))
        return executeAction(request, kCreateContentDefinition, createContent);

    return NextResponse.json({ success: false }, { status: 404 });
}

/**
 * PUT /api/content/:id
 */
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (Object.hasOwn(params, 'id'))
        return executeAction(request, kUpdateContentDefinition, updateContent, params);

    return NextResponse.json({ success: false }, { status: 404 });
}
