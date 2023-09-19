// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '@app/api/Action';

import { createBooking, kCreateBookingDefinition } from '../../createBooking';
import { deleteBooking, kDeleteBookingDefinition } from '../../deleteBooking';
import { updateBooking, kUpdateBookingDefinition } from '../../updateBooking';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { slug: string; id: string[]; } };

/**
 * DELETE /api/admin/hotel-bookings/:slug/:id
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (Object.hasOwn(params, 'id'))
        return executeAction(request, kDeleteBookingDefinition, deleteBooking, params);

    return NextResponse.json({ success: false }, { status: 404 });
}

/**
 * POST /api/admin/hotel-bookings/:slug
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (!Object.hasOwn(params, 'id'))
        return executeAction(request, kCreateBookingDefinition, createBooking, params);

    return NextResponse.json({ success: false }, { status: 404 });
}

/**
 * PUT /api/admin/hotel-bookings/:slug/:id
 */
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (Object.hasOwn(params, 'id'))
        return executeAction(request, kUpdateBookingDefinition, updateBooking, params);

    return NextResponse.json({ success: false }, { status: 404 });
}
