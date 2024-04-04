// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest } from 'next/server';
import { executeAction } from '../../../Action';

import { updateVendorSchedule, kUpdateVendorScheduleDefinition } from '../updateVendorSchedule';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { path: string[] } };

/**
 * The /api/admin/vendor/schedule endpoint can be used to update a vendor's schedule.
 */
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<Response> {
    return executeAction(request, kUpdateVendorScheduleDefinition, updateVendorSchedule, params);
}
