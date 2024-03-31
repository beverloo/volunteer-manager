// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest } from 'next/server';
import { executeAction } from '../../../Action';

import { getSchedule, kPublicScheduleDefinition } from '../getSchedule';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { path: string[] } };

/**
 * The /api/event/schedule endpoint can be used to acquire information about an event's schedule.
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<Response> {
    return executeAction(request, kPublicScheduleDefinition, getSchedule, params);
}
