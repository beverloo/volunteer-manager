// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Setting } from '@lib/Settings';
import { readSettings } from '@lib/Settings';

/**
 * Base implementation of a prompt builder, that the other prompt generation generators extend on.
 * The primary purpose of these classes is to collect the necessary context.
 */
export abstract class PromptBuilder {
    #context: string[];
    #promptSetting: Setting;

    constructor(promptSetting: Setting) {
        this.#context = [];
        this.#promptSetting = promptSetting;
    }

    /**
     * Returns the context that was generated for this prompt.
     */
    get context() { return this.#context; }

    /**
     * Returns the subject for a message of this type that's about to be sent out.
     */
    get subject(): string | undefined { return undefined; }

    /**
     * Builds the actual prompt, and returns the prompt as a string.
     */
    async build(): Promise<string> {
        const settings = await readSettings([
            'gen-ai-personality',
            this.#promptSetting,
        ]);

        this.#context = [
            'example context',
        ];

        return `${settings['gen-ai-personality']} ${settings['gen-ai-prompt-approve-volunteer']}`;
    }
}
