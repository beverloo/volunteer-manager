// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { TeamEventPromptContext, TeamEventPromptParams } from './TeamEventPrompt';
import { TeamEventPrompt } from './TeamEventPrompt';

/**
 * Prompt that can be used to convey to a volunteer that their application has been rejected.
 */
export class CancelParticipationPrompt extends TeamEventPrompt {
    constructor(params: TeamEventPromptParams) {
        super('gen-ai-intention-reject-volunteer', params);
    }

    override composeSubject(context: TeamEventPromptContext, language: string): string {
        switch (language) {
            case 'Dutch':
                return `Aanmelding voor ${context.event.name}`;
        }

        return `Your ${context.event.name} application`;
    }

    override composeMessage(context: TeamEventPromptContext): string[] {
        const message = super.composeMessage(context);
        message.push(
            `They currently are a volunteer at ${context.event.shortName}, where they are ` +
            `participating in the ${context.team.name} team.`);

        if (context.intention?.length)
            message.push(...context.intention.split('\n'));

        message.push('They can respond to this message with any further questions they may have.');

        return message;
    }
}
