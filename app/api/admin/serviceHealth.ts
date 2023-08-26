// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Privilege, can } from '@lib/auth/Privileges';
import { executePrompt } from './vertexAi';

/**
 * The services for which health check can be carried out.
 */
const ServiceEnumeration = z.enum([ 'Google', 'VertexAI' ]);

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
 * Runs a health check for the Google integration.
 */
async function runGoogleHealthCheck(): Promise<Response> {
    return {
        status: 'success',
        service: 'Google',
        message: 'Not yet implemented, auth failures are captured by Vertex AI',
    }
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
        case 'Google':
            return runGoogleHealthCheck();
        case 'VertexAI':
            return runVertexAIHealthCheck();
    }

    return {
        status: 'warning',
        service: request.service,
        message: 'No health check has been implemented for this service.'
    };
}