// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '../../Action';

import { hotelCreate, kHotelCreateDefinition } from '../hotelCreate';
import { hotelDelete, kHotelDeleteDefinition } from '../hotelDelete';
import { hotelUpdate, kHotelUpdateDefinition } from '../hotelUpdate';
import { logs, kLogsDefinition } from '../logs';
import { resetAccessCode, kResetAccessCodeDefinition } from '../resetAccessCode';
import { resetPasswordLink, kResetPasswordLinkDefinition } from '../resetPasswordLink';
import { updateActivation, kUpdateActivationDefinition } from '../updateActivation';
import { updateIntegration, kUpdateIntegrationDefinition } from '../updateIntegration';
import { updatePermissions, kUpdatePermissionsDefinition } from '../updatePermissions';
import { updateVolunteer, kUpdateVolunteerDefinition } from '../updateVolunteer';
import { vertexAi, kVertexAiDefinition } from '../vertexAi';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { path: string[] } };

/**
 * The /api/admin endpoint exposes the API for providing administrative functionality, both read and
 * write access. We're still making up our minds about how to balance RSC with API access.
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<Response> {
    const action = Object.hasOwn(params, 'path') ? params.path.join('/') : null;
    switch (action) {
        case 'hotel-create':
            return executeAction(request, kHotelCreateDefinition, hotelCreate);
        case 'hotel-delete':
            return executeAction(request, kHotelDeleteDefinition, hotelDelete);
        case 'hotel-update':
            return executeAction(request, kHotelUpdateDefinition, hotelUpdate);
        case 'logs':
            return executeAction(request, kLogsDefinition, logs);
        case 'reset-access-code':
            return executeAction(request, kResetAccessCodeDefinition, resetAccessCode);
        case 'reset-password-link':
            return executeAction(request, kResetPasswordLinkDefinition, resetPasswordLink);
        case 'update-activation':
            return executeAction(request, kUpdateActivationDefinition, updateActivation);
        case 'update-integration':
            return executeAction(request, kUpdateIntegrationDefinition, updateIntegration);
        case 'update-permissions':
            return executeAction(request, kUpdatePermissionsDefinition, updatePermissions);
        case 'update-volunteer':
            return executeAction(request, kUpdateVolunteerDefinition, updateVolunteer);
        case 'vertex-ai':
            return executeAction(request, kVertexAiDefinition, vertexAi);
    }

    return NextResponse.json({ success: false }, { status: 404 });
}
