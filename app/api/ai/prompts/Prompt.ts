// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { readSettings, type Setting } from '@lib/Settings';
import type { VertexAIClient } from '@lib/integrations/vertexai/VertexAIClient';
import db from '@lib/database';

/**
 * Context that has been collected by the prompt structure.
 */
export interface PromptContext {
    /**
     * The intention of the message, as predefined for this particular kind of prompt.
     */
    intention?: string;

    /**
     * The personality associated with the agent that will be shared with the API.
     */
    personality: string;

    /**
     * The system instruction(s) that should be shared with the API.
     */
    systemInstructions: string;
}

/**
 * Parameters that are expected to be available for the prompt.
 */
export interface PromptParams extends Partial<PromptContext> {
    /**
     * Language in which the prompt should be written. Defaults to "English".
     */
    language?: string;
}

/**
 * Result from to the Vertex AI API when we were to execute this prompt. Allows debugging interfaces
 * to output all known information to an administrator, to see what's going on.
 */
export interface PromptResult<Context, Params> {
    /**
     * Context that was gathered in order to power the prompt.
     */
    context: Context;

    /**
     * Message lines that should be included in the prompt.
     */
    message: string[];

    /**
     * Parameters that were given as input to the prompt.
     */
    params: Params;

    /**
     * The resulting answer received from the Vertex AI API.
     */
    result: string;

    /**
     * The subject line that should be used for the e-mail message.
     */
    subject: string;
}

/**
 * The `Prompt` class is the base class for each of the prompts supported by the AnimeCon Volunteer
 * Manager. Prompts use a "system instruction" to define personality and what has to happen, and
 * then a list of items that should be conveyed in a message.
 */
export abstract class Prompt<Context extends PromptContext, Params extends PromptParams> {
    #db: typeof db;

    #params: Params;
    #prompt: Setting;

    constructor(prompt: Setting, params: Params) {
        this.#db = db;

        this.#params = params;
        this.#prompt = prompt;
    }

    /**
     * Gets the database instance that should be used for this prompt.
     */
    get db() { return this.#db; }

    /**
     * Collects the necessary context in order to work with this prompt. Overrides of this method
     * are expected to call the parent method in order to make sure that all knowledge is known.
     */
    async collectContext(params: Params): Promise<PromptContext> {
        const settings = await readSettings([
            'gen-ai-personality',
            'gen-ai-system-instruction',
            this.#prompt,
        ]);

        return {
            intention: this.#params.intention ?? settings[this.#prompt] as string | undefined,
            personality:
                this.#params.personality ?? (settings['gen-ai-personality'] || ''),
            systemInstructions:
                this.#params.systemInstructions ?? (settings['gen-ai-system-instruction'] || ''),
        };
    }

    /**
     * Composes the points that have to be conveyed in the message. This is an array of data points
     * that the model is free to phase in any way it likes, in accordance to personality settings.
     * Overrides of this method are expected to call the parent method.
     */
    composeMessage(context: Context): string[] {
        return [ /* no message yet */ ];
    }

    /**
     * Composes the subject line for this e-mail message. This should be a single line of text,
     * ideally in the language that was requested.
     */
    abstract composeSubject(context: Context, language: string): string;

    /**
     * Generates the input data that is to be shared with the Vertex AI API, and then sends off the
     * request. The prompt's result will be returned by calling this method, or an exception when
     * anything went wrong or the model is temporarily unavailable.
     */
    async generate(client: VertexAIClient): Promise<PromptResult<Context, Params>> {
        const context = await this.collectContext(this.#params) as Context;
        const input: Omit<PromptResult<Context, Params>, 'result'> = {
            context,
            message: this.composeMessage(context),
            params: this.#params as Params,
            subject: this.composeSubject(context, this.#params.language || 'English'),
        };

        const result = await client.predictText({
            prompt: input.message.join('\n'),
            systemInstruction:
                input.context.personality + '\n' +
                input.context.systemInstructions.replace(
                    '{language}', this.#params.language || 'English'),
        });

        return {
            ...input,
            result: result || 'Something went wrong',
        };
    }
}
