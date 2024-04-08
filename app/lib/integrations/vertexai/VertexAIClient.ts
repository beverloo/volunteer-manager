// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { VertexAI } from '@google-cloud/vertexai';

import { GoogleClient, type GoogleClientSettings } from '../google/GoogleClient';
import { VertexSupportedModels } from './VertexSupportedModels';

/**
 * Publisher of the PaLM 2 model, as it makes no sense to train our own.
 */
const kPublisher = 'google';

/**
 * Settings required by the Vertex AI client.
 */
export interface VertexAISettings {
    /**
     * The model that should be used for generating responses.
     *
     * @see https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models
     */
    model: VertexSupportedModels;

    /**
     * Temperature controls the degree of randomness in token selection. Lower temperatures are good
     * for prompts that expect a true or correct response, while higher temperatures can lead to
     * more diverse or unexpected results.
     *
     * @range Must be in range of [0, 1)
     * @example 0.5
     */
    temperature: number;

    /**
     * Token limit determines the maximum amount of text output from one prompt. A token is
     * approximately four characters.
     *
     * @range Must be in range of [1, 1024)
     * @example 256
     */
    tokenLimit: number;

    /**
     * Top-k changes how the model selects tokens for output. A top-k of 1 means the selected token
     * is the most probable among all tokens in the model’s vocabulary (also called greedy decoding)
     * while a top-k of 3 means that the next token is selected from among the 3 most probable
     * tokens (using temperature).
     *
     * @range Must be in range of [1, 40)
     * @example 40
     */
    topK: number;

    /**
     * Top-p changes how the model selects tokens for output. Tokens are selected from most probable
     * to least until the sum of their probabilities equals the top-p value.
     *
     * @range Must be in range of [0, 1)
     * @example 0.8
     */
    topP: number;
}

/**
 * Settings required by the Vertex AI client, inclusive of settings owned by dependencies.
 */
export type VertexAIClientSettings = VertexAISettings & GoogleClientSettings;

/**
 * The Vertex AI client allows convenient access to the Google Vertex AI. It builds on top of the
 * Google client for authentication purposes.
 */
export class VertexAIClient {
    #googleClient: GoogleClient;
    #settings: VertexAISettings;

    constructor(settings: VertexAIClientSettings) {
        this.#googleClient = new GoogleClient(settings);
        this.#settings = settings;
    }

    /**
     * Predicts responses to the given `prompt`, which is the full string that should be fed to the
     * LLM, including instructions towards the answer that is expected from the model.
     */
    async predictText(prompt: string): Promise<string | undefined> {
        switch (this.#settings.model) {
            case 'text-bison':
            case 'text-bison@001':
            case 'text-bison@002':
                throw new Error('The PaLM models are no longer supported.');

            case 'gemini-pro':
                return this.predictTextGemini(prompt);
        }

        throw new Error(`Unrecognised model specified for prediction: ${this.#settings.model}`);
    }

    /**
     * Predicts responses to the given `prompt` using the Google Gemini model. The response will be
     * returned as a string when successful; `undefined` will be returned in all other cases.
     */
    private async predictTextGemini(prompt: string): Promise<string | undefined> {
        const client = new VertexAI({
            project: this.#googleClient.projectId,
            location: this.#googleClient.location,
            googleAuthOptions: {
                credentials: JSON.parse(this.#googleClient.credentials),
                scopes: 'https://www.googleapis.com/auth/cloud-platform',
            },
        });

        const model = client.preview.getGenerativeModel({
            model: this.#settings.model,
            generationConfig: {
                maxOutputTokens: this.#settings.tokenLimit,
                temperature: this.#settings.temperature,
                topK: this.#settings.topK,
                topP: this.#settings.topP,
            },
            // TODO: `safetySettings`
        });

        const result = await model.generateContent({
            contents: [
                {
                    role: 'USER',
                    parts: [
                        {
                            text: prompt,
                        }
                    ]
                }
            ],
        });

        // Deal with the response. Surely there ought to be a nicer way of validating the response,
        // rather than assuming that it's correct. For now this will do however.
        if (typeof result === 'object' && Object.hasOwn(result, 'response')) {
            const response = await result.response;
            if (Array.isArray(response.candidates) && response.candidates.length >= 1) {
                const candidate = response.candidates[0];
                if (candidate.content?.parts?.length >= 1)
                    return candidate.content.parts[0].text;
            }
        }

        return undefined;
    }
}
