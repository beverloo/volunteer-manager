// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * The humour that can be included in the prompt. This will be considered on top of tone.
 */
const kHumourOptions = {
    Never: undefined,
    Sometimes: 'Consider adding a minor joke or pun, but only if it is appropriate.',
    Often: 'Consider adding a joke or pun when there is an opportunity, and it is appropriate.',
};

/**
 * The available humour types that can be considered as an enumeration type.
 */
export type VertexPromptHumour = keyof typeof kHumourOptions;

/**
 * The types of identification that the writer of the message may consider for the prompt. Not
 * everyone wants to sign messages in exactly the same way.
 */
const kIdentityOptions = {
    Individual: 'Your name is {name}.',
    Team: 'Your name is {name}, and you write on behalf of the {team} team.',
    Organisation: 'Your name is {name}, and you write on behalf of the AnimeCon volunteering teams',
};

/**
 * The available identity types that can be considered as an enumeration type.
 */
export type VertexPromptIdentity = keyof typeof kIdentityOptions;

/**
 * The tones available to the prompt builder, including the prompt that it leads to.
 */
const kToneOptions = {
    Formal: 'Be formal and direct, yet realistic and carefully empathetic.',
    Informal: 'Be informal and conversational as if you were talking to a friend, yet empathetic.',
    Optimistic: 'Be optimistic in tone, empathetic and realistic.',
    Friendly: 'Be friendly as if you were talking to an acquaintance, with a warming tone.',
    Assertive: 'Be brief, assertive, clear in your intent yet also empathetic and understanding.',
    Cooperative: 'Be cooperative in tone, friendly and warm, yet also professional and brief.',
};

/**
 * The available tones that can be considered as an enumeration type.
 */
export type VertexPromptTone = keyof typeof kToneOptions;

/**
 * The Google Vertex AI Prompt builder can be used to dynamically write a prompt incorporating
 * various settings regarding style, tone and more.
 */
export class VertexPromptBuilder {
    #humour: VertexPromptHumour;
    #identity: VertexPromptIdentity;
    #motivation: string | undefined;
    #narrative: string | undefined;
    #tone: VertexPromptTone;

    #values: Record<string, string>;

    /**
     * Create a new prompt builder on behalf of the given `name`, who is creating the message on
     * behalf of the given `team`.
     */
    static createForPerson(name: string, team: string) {
        return new VertexPromptBuilder({ name, team });
    }

    private constructor(values: Record<string, string>) {
        this.#humour = 'Never';
        this.#identity = 'Individual';
        this.#motivation = undefined;
        this.#narrative = undefined;
        this.#tone = 'Cooperative';

        this.#values = values;
    }

    /**
     * Tells this prompt to write an e-mail with the given `narrative`.
     */
    forSituation(narrative: string): VertexPromptBuilder {
        this.#narrative = narrative;
        return this;
    }

    /**
     * Sets the amount of humour to consider in the prompt to `humour`.
     */
    withHumour(humour: VertexPromptHumour): VertexPromptBuilder {
        this.#humour = humour;
        return this;
    }

    /**
     * Sets the degree of identity of the writer in the prompt to `identity`.
     */
    withIdentity(identity: VertexPromptIdentity): VertexPromptBuilder {
        this.#identity = identity;
        return this;
    }

    /**
     * Sets the motivation of the prompt to the given `motivation`.
     */
    withMotivation(motivation: string): VertexPromptBuilder {
        this.#motivation = motivation;
        return this;
    }

    /**
     * Sets the tone of the message that should be written to `tone`.
     */
    withTone(tone: VertexPromptTone): VertexPromptBuilder {
        this.#tone = tone;
        return this;
    }

    /**
     * Sets the value ({`name`}) to the given `value`.
     */
    withValue(name: string, value: string): VertexPromptBuilder {
        this.#values[name] = value;
        return this;
    }

    /**
     * Actually build the prompt together based on all the input variables.
     */
    build(): string {
        const composedPrompt = [
            this.#narrative,
            this.#motivation,
            kToneOptions[this.#tone],
            kIdentityOptions[this.#identity],
            kHumourOptions[this.#humour],
        ].filter(Boolean).join(' ');

        let contextualizedPrompt = composedPrompt;
        for (const [ key, value ] of Object.entries(this.#values))
            contextualizedPrompt = contextualizedPrompt.replaceAll(`{${key}}`, value);

        return contextualizedPrompt;
    }
}
