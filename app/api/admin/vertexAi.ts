// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { default as aiplatform, helpers } from '@google-cloud/aiplatform';

import { type ActionProps, noAccess } from '../Action';
import { Privilege, can } from '@lib/auth/Privileges';
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
         * The prompt that should be input to the LLM generation model.
         */
        prompt: z.string(),

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
 * Publisher of the PaLM 2 model, as it makes no sense to train our own.
 */
const kPublisher = 'google';

/**
 * Executes the given `prompt` using the VertexAI implementation. Optionally the `settings` can be
 * given to customise the response that should be requested.
 */
export async function executePrompt(prompt: string, settings?: z.infer<typeof kVertexAiSettings>)
    : Promise<string | undefined>
{
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

    // (1) Get a PredictionServiceClient instance. The stored Google credential information will
    //     be used, and cannot be overridden by the API request.
    const predictionServiceClient = new aiplatform.PredictionServiceClient({
        apiEndpoint: `${defaultSettings['integration-google-location']}-aiplatform.googleapis.com`,
        credentials: JSON.parse(defaultSettings['integration-google-credentials']!)
    });

    // (2) Compose the settings necessary for the request. This exists of an endpoint with way too
    //     much information contained therein, our prompt and the parameters as given.
    const endpointComponents = [
        'projects',
        defaultSettings['integration-google-project-id'],
        'locations',
        defaultSettings['integration-google-location'],
        'publishers',
        kPublisher,
        'models',
        settings?.model ?? defaultSettings['integration-vertex-model'] ?? 'text-bison@001',
    ];

    const instance = { prompt };
    const parameters = {
        temperature:
            settings?.temperature ?? defaultSettings['integration-vertex-temperature'] ?? 0.2,
        maxOutputTokens: settings?.tokenLimit ??
            defaultSettings['integration-vertex-token-limit'] ?? 256,
        topK: settings?.topK ?? defaultSettings['integration-vertex-top-k'] ?? 40,
        topP: settings?.topP ?? defaultSettings['integration-vertex-top-p'] ?? 0.95,
    };

    // (3) Issue the actual request to the Vertex AI APIs. This uses Google's APIs.
    const vertexResponse = await predictionServiceClient.predict({
        endpoint: endpointComponents.join('/'),
        instances: [ helpers.toValue(instance)! ],
        parameters: helpers.toValue(parameters),
    });

    // (4) Deal with the response. Surely there ought to be a nicer way of validating the response,
    //     rather than assuming that it's correct. For now this will do however.
    if (Array.isArray(vertexResponse) && vertexResponse.length > 0) {
        const predictions = vertexResponse[0].predictions;
        if (Array.isArray(predictions) && predictions.length > 0) {
            const prediction = predictions[0];
            if (prediction.structValue && prediction.structValue.fields) {
                const { content } = prediction.structValue.fields;
                return content.stringValue ?? undefined;
            }
        }
    }

    return undefined;  // no response
}

/**
 * API that allows the administrative section to communicate with the Google Vertex AI APIs. Will
 * use the settings stored in the database when they are not set in the request.
 */
export async function vertexAi(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.SystemAdministrator))
        noAccess();

    return { result: await executePrompt(request.prompt, request.settings) };
}
