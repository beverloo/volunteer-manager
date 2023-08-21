// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { writeSettings } from '@lib/Settings';

import { kVertexAiSettings } from './vertexAi';

/**
 * Interface definition for the Update Integration API, exposed through
 * /api/admin/update-integration.
 */
export const kUpdateIntegrationDefinition = z.object({
    request: z.object({
        /**
         * Google settings that should be updated.
         */
        google: z.object({
            credential: z.string(),
            location: z.string(),
            projectId: z.string(),
        }).optional(),

        /**
         * Vertex AI prompt settings that should be updated.
         */
        prompts: z.object({
            approveVolunteer: z.string(),
            rejectVolunteer: z.string(),
        }).optional(),

        /**
         * Vertex AI settings that should be updated.
         */
        vertexAi: kVertexAiSettings.optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the integration settings were updated successfully.
         */
        success: z.boolean(),
    }),
});

export type UpdateIntegrationDefinition = z.infer<typeof kUpdateIntegrationDefinition>;

type Request = UpdateIntegrationDefinition['request'];
type Response = UpdateIntegrationDefinition['response'];

/**
 * API that allows the settings regarding a particular integration to be updated. The server call
 * allows for any number of integrations to be dealt with at once, and they can be gated behind
 * different permission levels if need be.
 */
export async function updateIntegration(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.SystemAdministrator))
        noAccess();

    if (request.google) {
        await writeSettings({
            'integration-google-credentials': request.google.credential,
            'integration-google-location': request.google.location,
            'integration-google-project-id': request.google.projectId,
        });

        await Log({
            type: LogType.AdminUpdateGoogleIntegration,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
        });
    }

    if (request.prompts) {
        await writeSettings({
            'integration-prompt-approve-volunteer': request.prompts.approveVolunteer,
            'integration-prompt-reject-volunteer': request.prompts.rejectVolunteer,
        });

        await Log({
            type: LogType.AdminUpdatePromptIntegration,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
        });
    }

    if (request.vertexAi) {
        await writeSettings({
            'integration-vertex-model': request.vertexAi.model,
            'integration-vertex-temperature': request.vertexAi.temperature,
            'integration-vertex-token-limit': request.vertexAi.tokenLimit,
            'integration-vertex-top-k': request.vertexAi.topK,
            'integration-vertex-top-p': request.vertexAi.topP,
        });

        await Log({
            type: LogType.AdminUpdateVertexIntegration,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
        });
    }

    return { success: true };
}
