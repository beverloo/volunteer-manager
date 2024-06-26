// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '../../Action';

import { createEvent, kCreateEventDefinition } from '../createEvent';
import { resetAccessCode, kResetAccessCodeDefinition } from '../resetAccessCode';
import { resetPasswordLink, kResetPasswordLinkDefinition } from '../resetPasswordLink';
import { serviceHealth, kServiceHealthDefinition } from '../serviceHealth';
import { updateActivation, kUpdateActivationDefinition } from '../updateActivation';
import { updateEvent, kUpdateEventDefinition } from '../updateEvent';
import { updateIntegration, kUpdateIntegrationDefinition } from '../updateIntegration';
import { updatePermissions, kUpdatePermissionsDefinition } from '../updatePermissions';
import { updateSettings, kUpdateSettingsDefinition } from '../updateSettings';
import { updateTeam, kUpdateTeamDefinition } from '../updateTeam';
import { updateVolunteer, kUpdateVolunteerDefinition } from '../updateVolunteer';
import { vertexAi, kVertexAiDefinition } from '../vertexAi';
import { volunteerContactInfo, kVolunteerContactInfoDefinition } from '../volunteerContactInfo';
import { volunteerList, kVolunteerListDefinition } from '../volunteerList';
import { volunteerRoles, kVolunteerRolesDefinition } from '../volunteerRoles';
import { volunteerTeams, kVolunteerTeamsDefinition } from '../volunteerTeams';

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
        case 'create-event':
            return executeAction(request, kCreateEventDefinition, createEvent);
        case 'reset-access-code':
            return executeAction(request, kResetAccessCodeDefinition, resetAccessCode);
        case 'service-health':
            return executeAction(request, kServiceHealthDefinition, serviceHealth);
        case 'reset-password-link':
            return executeAction(request, kResetPasswordLinkDefinition, resetPasswordLink);
        case 'update-activation':
            return executeAction(request, kUpdateActivationDefinition, updateActivation);
        case 'update-event':
            return executeAction(request, kUpdateEventDefinition, updateEvent);
        case 'update-integration':
            return executeAction(request, kUpdateIntegrationDefinition, updateIntegration);
        case 'update-permissions':
            return executeAction(request, kUpdatePermissionsDefinition, updatePermissions);
        case 'update-settings':
            return executeAction(request, kUpdateSettingsDefinition, updateSettings);
        case 'update-team':
            return executeAction(request, kUpdateTeamDefinition, updateTeam);
        case 'update-volunteer':
            return executeAction(request, kUpdateVolunteerDefinition, updateVolunteer);
        case 'vertex-ai':
            return executeAction(request, kVertexAiDefinition, vertexAi);
        case 'volunteer-contact-info':
            return executeAction(request, kVolunteerContactInfoDefinition, volunteerContactInfo);
        case 'volunteer-list':
            return executeAction(request, kVolunteerListDefinition, volunteerList);
        case 'volunteer-roles':
            return executeAction(request, kVolunteerRolesDefinition, volunteerRoles);
        case 'volunteer-teams':
            return executeAction(request, kVolunteerTeamsDefinition, volunteerTeams);
    }

    return NextResponse.json({ success: false }, { status: 404 });
}
