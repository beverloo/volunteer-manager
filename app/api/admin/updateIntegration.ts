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
         * AnimeCon API settings that should be updated.
         */
        animecon: z.object({
            apiEndpoint: z.string(),
            authEndpoint: z.string(),
            clientId: z.string(),
            clientSecret: z.string(),
            username: z.string(),
            password: z.string(),
            scopes: z.string(),
        }).optional(),

        /**
         * E-mail settings that should be updated.
         */
        email: z.object({
            hostname: z.string(),
            port: z.number(),
            username: z.string(),
            password: z.string(),
        }).optional(),

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

    if (request.animecon) {
        await writeSettings({
            'integration-animecon-api-endpoint': request.animecon.apiEndpoint,
            'integration-animecon-auth-endpoint': request.animecon.authEndpoint,
            'integration-animecon-client-id': request.animecon.clientId,
            'integration-animecon-client-secret': request.animecon.clientSecret,
            'integration-animecon-username': request.animecon.username,
            'integration-animecon-password': request.animecon.password,
            'integration-animecon-scopes': request.animecon.scopes,
        });

        await Log({
            type: LogType.AdminUpdateAnimeConIntegration,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
        });
    }

    if (request.email) {
        await writeSettings({
            'integration-email-smtp-hostname': request.email.hostname,
            'integration-email-smtp-port': request.email.port,
            'integration-email-smtp-username': request.email.username,
            'integration-email-smtp-password': request.email.password,
        });

        await Log({
            type: LogType.AdminUpdateEmailIntegration,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
        });
    }

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
