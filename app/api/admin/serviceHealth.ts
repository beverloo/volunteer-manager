// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Client as AnimeConClient } from '@lib/integrations/animecon/Client';
import { Privilege, can } from '@lib/auth/Privileges';
import { executePrompt } from './vertexAi';
import { readSettings } from '@lib/Settings';

/**
 * The services for which health check can be carried out.
 */
const ServiceEnumeration = z.enum([ 'AnimeCon', 'Google', 'VertexAI' ]);

/**
 * Interface definition for the Integration API, exposed through /api/admin/service-health.
 */
export const kServiceHealthDefinition = z.object({
    request: z.object({
        /**
         * The service for which its health should be confirmed.
         */
        service: ServiceEnumeration,
    }),
    response: z.strictObject({
        /**
         * The service for which a health check was carried out.
         */
        service: ServiceEnumeration,

        /**
         * Whether the API call was able to execute successfully.
         */
        status: z.enum([ 'success', 'warning', 'error' ]),

        /**
         * Message that should accompany the service health check result.
         */
        message: z.string().optional(),
    }),
});

export type ServiceHealthDefinition = z.infer<typeof kServiceHealthDefinition>;

type Request = ServiceHealthDefinition['request'];
type Response = ServiceHealthDefinition['response'];

/**
 * Runs a health check for the AnimeCon integration.
 */
async function runAnimeConHealthCheck(): Promise<Response> {
    try {
        const settings = await readSettings([
            'integration-animecon-api-endpoint',
            'integration-animecon-auth-endpoint',
            'integration-animecon-client-id',
            'integration-animecon-client-secret',
            'integration-animecon-username',
            'integration-animecon-password',
            'integration-animecon-scopes',
        ]);

        const client = new AnimeConClient({
            apiEndpoint: settings['integration-animecon-api-endpoint']!,
            authEndpoint: settings['integration-animecon-auth-endpoint']!,
            clientId: settings['integration-animecon-client-id']!,
            clientSecret: settings['integration-animecon-client-secret']!,
            username: settings['integration-animecon-username']!,
            password: settings['integration-animecon-password']!,
            scopes: settings['integration-animecon-scopes']!,
        });

        const activityTypes = await client.getActivityTypes();
        if (!activityTypes.length)
            throw new Error('No activity types were returned.');

        return {
            status: 'success',
            service: 'AnimeCon',
            message: `The integration is functional (${activityTypes.length} activity types)`,
        };
    } catch (error: any) {
        return {
            status: 'error',
            service: 'AnimeCon',
            message: error.message,
        };
    }
}

/**
 * Runs a health check for the Google integration.
 */
async function runGoogleHealthCheck(): Promise<Response> {
    return {
        status: 'warning',
        service: 'Google',
        message: 'Health check has not been implemented yet',
    };
}

/**
 * Runs a health check for the Google Vertex AI integration. This health check works by executing a
 * simple prompt using the VertexAI API and confirming that a non-empty response is obtained.
 */
async function runVertexAIHealthCheck(): Promise<Response> {
    try {
        const response = await executePrompt('Who is your favourite artist?');
        if (typeof response === 'string') {
            return {
                status: 'success',
                service: 'VertexAI',
                message: `The integration is functional ("${response}")`
            };
        }

        throw new Error('The Vertex AI API did not return a response...');
    } catch (error: any) {
        return {
            status: 'error',
            service: 'VertexAI',
            message: error.message,
        };
    }
}

/**
 * API that allows the health of our integrations to be checked. One request will be fired off for
 * each integration that we support.
 */
export async function serviceHealth(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.SystemAdministrator))
        noAccess();

    switch (request.service) {
        case 'AnimeCon':
            return runAnimeConHealthCheck();
        case 'Google':
            return runGoogleHealthCheck();
        case 'VertexAI':
            return runVertexAIHealthCheck();
    }
}
