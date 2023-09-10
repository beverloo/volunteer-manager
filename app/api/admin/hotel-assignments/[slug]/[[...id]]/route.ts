// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '@app/api/Action';

import { createAssignment, kCreateAssignmentDefinition } from '../../createAssignment';
import { deleteAssignment, kDeleteAssignmentDefinition } from '../../deleteAssignment';
import { updateAssignment, kUpdateAssignmentDefinition } from '../../updateAssignment';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { slug: string; id: string[]; } };

/**
 * DELETE /api/admin/hotel-assignments/:slug/:id
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (Object.hasOwn(params, 'id'))
        return executeAction(request, kDeleteAssignmentDefinition, deleteAssignment, params);

    return NextResponse.json({ success: false }, { status: 404 });
}

/**
 * POST /api/admin/hotel-assignments/:slug
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (!Object.hasOwn(params, 'id'))
        return executeAction(request, kCreateAssignmentDefinition, createAssignment, params);

    return NextResponse.json({ success: false }, { status: 404 });
}

/**
 * PUT /api/admin/hotel-assignments/:slug/:id
 */
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (Object.hasOwn(params, 'id'))
        return executeAction(request, kUpdateAssignmentDefinition, updateAssignment, params);

    return NextResponse.json({ success: false }, { status: 404 });
}
