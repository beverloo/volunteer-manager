// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../../Action';
import { Privilege, can } from '@lib/auth/Privileges';

/**
 * Interface definition for the Outbox API, exposed through /api/admin/outbox.
 */
export const kGetOutboxDefinition = z.object({
    request: z.object({

    }),
    response: z.strictObject({

    }),
});

export type GetOutboxDefinition = z.infer<typeof kGetOutboxDefinition>;

type Request = GetOutboxDefinition['request'];
type Response = GetOutboxDefinition['response'];

/**
 * API that allows volunteers with outbox access to consult a particular message. This endpoint
 * allows information about a specific message to be retrieved.
 */
export async function getOutbox(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.SystemOutboxAccess))
        noAccess();

    return {};
}
