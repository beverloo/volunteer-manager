// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Setting } from '@lib/Settings';
import { readSettings } from '@lib/Settings';

/**
 * What message should the message be written in?
 */
type PromptBuilderLanguage = 'Dutch' | 'English';

/**
 * Result of building the PromptBuilder with the given input.
 */
type PromptBuilderResult = { context: string[]; prompt: string; };

/**
 * Base implementation of a prompt builder, that the other prompt generation generators extend on.
 * The primary purpose of these classes is to collect the necessary context.
 */
export abstract class PromptBuilder<Params extends {}, Context extends Record<string, any>> {
    #promptParams: Params | undefined;
    #promptSetting: Setting;
    #userId: number;

    constructor(userId: number, promptParams: Params | undefined, promptSetting: Setting) {
        this.#promptParams = promptParams;
        this.#promptSetting = promptSetting;
        this.#userId = userId;
    }

    /**
     * Returns the subject for a message of this type that's about to be sent out.
     */
    get subject(): string | undefined { return undefined; }

    /**
     * Collects the prompt context based on the given `params`.
     */
    abstract collectContext(userId: number, params: Params): Context | Promise<Context>;

    /**
     * Collects example context in absence of input parameters, generally for example purposes.
     */
    abstract collectExampleContext(userId: number): Context | Promise<Context>;

    /**
     * Composes the given `context` in a series of strings that will be appended to the prompt.
     */
    abstract composeContext(context: Context): string[] | Promise<string[]>;

    /**
     * Builds the actual prompt, and returns the prompt as a string.
     */
    async build(language: PromptBuilderLanguage): Promise<PromptBuilderResult> {
        const settings = await readSettings([ 'gen-ai-personality', this.#promptSetting ]);

        const personality = settings['gen-ai-personality'];
        const prompt = settings[this.#promptSetting];

        const languageRequest = `Write the prompt in ${language}.`;

        const context = await this.composeContext(
            this.#promptParams ? await this.collectContext(this.#userId, this.#promptParams)
                               : await this.collectExampleContext(this.#userId));

        return {
            context,
            prompt: `${personality} ${context.join(' ')} ${prompt} ${languageRequest}`,
        };
    }
}
