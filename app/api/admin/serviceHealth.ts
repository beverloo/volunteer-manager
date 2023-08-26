// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Privilege, can } from '@lib/auth/Privileges';

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
        message: z.string(),
    }),
});

export type ServiceHealthDefinition = z.infer<typeof kServiceHealthDefinition>;

type Request = ServiceHealthDefinition['request'];
type Response = ServiceHealthDefinition['response'];

/**
 * API that allows the health of our integrations to be checked. One request will be fired off for
 * each integration that we support.
 */
export async function serviceHealth(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.SystemAdministrator))
        noAccess();

    return { status: 'warning', service: request.service, message: 'Not yet implemented' };
}
