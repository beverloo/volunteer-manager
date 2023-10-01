// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '@app/api/Action';

import { deleteAdvice, kDeleteAdviceDefinition } from '../deleteAdvice';
import { updateAdvice, kUpdateAdviceDefinition } from '../updateAdvice';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { id: string; } };

/**
 * DELETE /api/nardo/:id
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (Object.hasOwn(params, 'id'))
        return executeAction(request, kDeleteAdviceDefinition, deleteAdvice, params);

    return NextResponse.json({ success: false }, { status: 404 });
}


/**
 * PUT /api/nardo/:id
 */
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (Object.hasOwn(params, 'id'))
        return executeAction(request, kUpdateAdviceDefinition, updateAdvice, params);

    return NextResponse.json({ success: false }, { status: 404 });
}
