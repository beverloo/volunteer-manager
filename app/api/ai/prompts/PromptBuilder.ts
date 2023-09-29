// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Setting } from '@lib/Settings';
import { readSettings } from '@lib/Settings';

/**
 * What message should the message be written in?
 */
export type PromptBuilderLanguage =
    'Dutch' | 'English' | 'French' | 'German' | 'Japanese' | 'Spanish';

/**
 * Result of building the PromptBuilder with the given input.
 */
type PromptBuilderResult = { context: string[]; prompt: string; subject: string; };

/**
 * Base implementation of a prompt builder, that the other prompt generation generators extend on.
 * The primary purpose of these classes is to collect the necessary context.
 */
export abstract class PromptBuilder<Params extends {}, Context extends Record<string, any>> {
    #promptParams: Params | undefined;
    #promptSetting: Setting;
    #userId: number;

    #personalityOverride: string | undefined;
    #promptOverride: string | undefined;

    constructor(userId: number, promptParams: Params | undefined, promptSetting: Setting) {
        this.#promptParams = promptParams;
        this.#promptSetting = promptSetting;
        this.#userId = userId;

        this.#personalityOverride = undefined;
        this.#promptOverride = undefined;
    }

    /**
     * Sets the prompt configuration overrides to the given `personality` and `prompt`.
     */
    setOverrides(personality: string, prompt: string): void {
        this.#personalityOverride = personality;
        this.#promptOverride = prompt;
    }

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
     * Composes the subject for the message based on the given `Context`.
     */
    abstract composeSubject(context: Context, language: PromptBuilderLanguage)
        : string | Promise<string>;

    /**
     * Composes the language request based on the given `language`.
     */
    composeLanguageRequest(language: PromptBuilderLanguage): string {
        switch (language) {
            case 'English':
                // This is the default language, don't include anything special.
                return '';

            case 'Dutch':
                return 'Write your message in Dutch, translate application as aanmelding.';

            case 'French':
            case 'German':
            case 'Japanese':
            case 'Spanish':
                return `Write your message in ${language}.`;
        }
    }

    /**
     * Builds the actual prompt, and returns the prompt as a string.
     */
    async build(language: PromptBuilderLanguage): Promise<PromptBuilderResult> {
        const settings = await readSettings([ 'gen-ai-personality', this.#promptSetting ]);

        const personality = this.#personalityOverride ?? settings['gen-ai-personality'];
        const prompt = this.#promptOverride ?? settings[this.#promptSetting];

        const languageRequest = this.composeLanguageRequest(language);

        const inputContext =
            this.#promptParams ? await this.collectContext(this.#userId, this.#promptParams)
                               : await this.collectExampleContext(this.#userId);

        const context = await this.composeContext(inputContext);
        const subject = await this.composeSubject(inputContext, language);

        return {
            context,
            prompt: `${personality} ${context.join(' ')} ${prompt} ${languageRequest}`,
            subject,
        };
    }
}
