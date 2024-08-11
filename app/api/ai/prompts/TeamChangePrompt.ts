// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { TeamEventPromptContext, TeamEventPromptParams } from './TeamEventPrompt';
import { TeamEventPrompt } from './TeamEventPrompt';

/**
 * Context that has been collected by the prompt structure.
 */
export interface TeamChangePromptContext extends TeamEventPromptContext {
    /**
     * Context about the team that the volunteer will be moving to.
     */
    updatedTeam: {
        name: string;
        shortName: string;
        description: string;

        domain: string;
        domainSlug: string;

        requestConfirmation: boolean;
        whatsApp?: string;
    };
}

/**
 * Parameters that are expected to be available for the prompt.
 */
export interface TeamChangePromptParams extends TeamEventPromptParams {
    /**
     * URL-safe slug representing the team to which the volunteer will be moving.
     */
    updatedTeam: string;
}

/**
 * Prompt that can be used to convey to a volunteer that their application has been approved.
 */
export class TeamChangePrompt extends TeamEventPrompt<TeamChangePromptContext,
                                                      TeamChangePromptParams> {
    constructor(params: TeamChangePromptParams) {
        super('gen-ai-intention-change-team', params);
    }

    override async collectContext(params: TeamChangePromptParams)
        : Promise<TeamChangePromptContext>
    {
        const base = await super.collectContext(params);
        return {
            ...base,
            updatedTeam: await this.fetchTeamInfo(base, params.updatedTeam),
        };
    }

    override composeSubject(context: TeamChangePromptContext, language: string): string {
        switch (language) {
            case 'Dutch':
                return `Aanmelding voor ${context.event.name}`;
        }

        return `Your ${context.event.name} application`;
    }

    override composeMessage(context: TeamChangePromptContext): string[] {
        const message = super.composeMessage(context);
        message.push(
            `They currently are a volunteer at ${context.event.shortName}, where they are ` +
            `participating in the ${context.team.name} team.`);

        if (context.intention?.length)
            message.push(...context.intention.split('\n'));

        message.push(
            `Their new team is the ${context.updatedTeam.name} team, who are responsible for ` +
            context.updatedTeam.description);

        message.push(
            'They will be able to share their preferences regarding participation on: ' +
            `https://${context.updatedTeam.domain}/registration/${context.updatedTeam.domainSlug}` +
            '/application')

        if (context.updatedTeam.whatsApp) {
            message.push(
                `They are welcome to join our private WhatsApp group on ` +
                context.updatedTeam.whatsApp);
        }

        message.push('They can respond to this message with any further questions they may have.');

        return message;
    }
}
