// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '../../Action';

import type { NextRouteParams } from '@lib/NextRouterParams';
import { availabilityPreferences, kAvailabilityPreferencesDefinition } from '../availabilityPreferences';

/**
 * The /api/event endpoint exposes APIs related to a particular event such as participation
 * applications and modifications, feedback reports, and so on.
 */
export async function POST(request: NextRequest, props: NextRouteParams<never, 'path'>)
    : Promise<Response>
{
    const params = await props.params;
    const action = Object.hasOwn(params, 'path') ? params.path!.join('/') : null;

    switch (action) {
        case 'availability-preferences':
            return executeAction(
                request, kAvailabilityPreferencesDefinition, availabilityPreferences);
    }

    return NextResponse.json({ success: false }, { status: 404 });
}
