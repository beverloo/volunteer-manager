// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Privilege, can } from '@lib/auth/Privileges';
import { createVertexAIClient } from '@lib/integrations/vertexai';
import { readSettings } from '@lib/Settings';

/**
 * The Vertex AI settings object. Shared across multiple API calls.
 */
export const kVertexAiSettings = z.object({
    model: z.enum([ 'text-bison', 'text-bison@001' ]),
    temperature: z.number().gte(0).lte(1),
    tokenLimit: z.number().gte(1).lte(1024),
    topK: z.number().gte(1).lte(40),
    topP: z.number().gte(0).lte(1),
});

/**
 * Interface definition for the Vertex AI API, exposed through /api/admin/vertex-ai.
 */
export const kVertexAiDefinition = z.object({
    request: z.object({
        /**
         * The prompt that should be input to the LLM generation model. Must not be empty.
         */
        prompt: z.string().nonempty(),

        /**
         * Settings that should be considered when making an API call. Will be fetched from the
         * database when omitted, only applicable to configuration pages.
         */
        settings: kVertexAiSettings.optional(),
    }),
    response: z.strictObject({
        /**
         * The result as it has been generated. Empty if an error occurred.
         */
        result: z.string().optional(),
    }),
});

export type VertexAiDefinition = z.infer<typeof kVertexAiDefinition>;

type Request = VertexAiDefinition['request'];
type Response = VertexAiDefinition['response'];

/**
 * API that allows the administrative section to communicate with the Google Vertex AI APIs. Will
 * use the settings stored in the database when they are not set in the request.
 */
export async function vertexAi(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.SystemAdministrator))
        noAccess();

    const { settings } = request;

    const defaultSettings = await readSettings([
        // Google:
        'integration-google-credentials',
        'integration-google-location',
        'integration-google-project-id',

        // Google Vertex AI:
        'integration-vertex-model',
        'integration-vertex-temperature',
        'integration-vertex-token-limit',
        'integration-vertex-top-k',
        'integration-vertex-top-p',
    ]);

    const client = await createVertexAIClient({
        credentials: defaultSettings['integration-google-credentials']!,
        location: defaultSettings['integration-google-location']!,
        projectId: defaultSettings['integration-google-project-id']!,

        model: settings?.model ?? defaultSettings['integration-vertex-model']!,
        temperature: settings?.temperature ?? defaultSettings['integration-vertex-temperature']!,
        tokenLimit: settings?.tokenLimit ?? defaultSettings['integration-vertex-token-limit']!,
        topK: settings?.topK ?? defaultSettings['integration-vertex-top-k']!,
        topP: settings?.topP ?? defaultSettings['integration-vertex-top-p']!,
    });

    return { result: await client.predictText(request.prompt) };
}
