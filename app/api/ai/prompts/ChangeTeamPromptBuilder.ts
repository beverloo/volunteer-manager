// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type ParticipationContext, composeParticipationContext, generateParticipationContext } from './generateParticipationContext';
import { type EventContext, composeEventContext, generateEventContext } from './generateEventContext';
import { type PromptBuilderLanguage, PromptBuilder } from './PromptBuilder';
import { type UpdatedTeamContext, composeUpdatedTeamContext, generateUpdatedTeamContext } from './generateUpdatedTeamContext';
import { type UserContext, composeUserContext, generateUserContext } from './generateUserContext';
import { Temporal } from '@lib/Temporal';

/**
 * Parameters expected by the `ChangeTeamVolunteerPromptBuilder` class.
 */
interface ChangeTeamParams {
    userId: number;
    event: string;
    currentTeam: string;
    updatedTeam: string;
}

/**
 * Context collected by the `ChangeTeamVolunteerPromptBuilder` class.
 */
interface ChangeTeamContext {
    currentTeam: ParticipationContext;
    updatedTeam: UpdatedTeamContext;
    event: EventContext;
    user: UserContext;
}

/**
 * Prompt generator for the situation in which a volunteer has had their team changed to one they
 * did not directly sign up to. A small courtesy message will inform them of this change.
 */
export class ChangeTeamPromptBuilder extends PromptBuilder<ChangeTeamParams, ChangeTeamContext> {
    constructor(userId: number, params?: ChangeTeamParams) {
        super(userId, params, 'gen-ai-prompt-change-team');
    }

    // ---------------------------------------------------------------------------------------------
    // PromptBuilder implementation:
    // ---------------------------------------------------------------------------------------------

    override async collectContext(userId: number, params: ChangeTeamParams)
        : Promise<ChangeTeamContext>
    {
        return {
            currentTeam:
                await generateParticipationContext(params.userId, params.event, params.currentTeam),
            updatedTeam:
                await generateUpdatedTeamContext(params.userId, params.event, params.updatedTeam),
            event: await generateEventContext(params.event),
            user: await generateUserContext(userId, params.event),
        }
    }

    override async collectExampleContext(userId: number): Promise<ChangeTeamContext> {
        return {
            currentTeam: {
                event: 'acon-classic',
                firstName: 'Joe',
                teamName: 'Festival Hosts',
                teamDescription: 'Festival Hosts [guide](#) visitors to where they need to be.',
                team: 'hosts.team',
            },
            updatedTeam: {
                event: 'acon-classic',
                teamName: 'Volunteering Crew',
                team: 'animecon.team',
                whatsappLink: 'https://whatsapp.com/join-my-group',
            },
            event: {
                name: 'AnimeCon Classic',
                location: 'Theaterhotel in Almelo',
                startTime: Temporal.Now.zonedDateTimeISO('UTC').add({ days: 40 }),
                endTime: Temporal.Now.zonedDateTimeISO('UTC').add({ days: 42 }),
            },
            user: await generateUserContext(userId),
        }
    }

    override composeContext(context: ChangeTeamContext): string[] {
        const composition: string[] = [];

        composition.push(...composeUserContext(context.user));
        composition.push(...composeEventContext(context.event));
        composition.push(...composeParticipationContext(context.currentTeam, false));
        composition.push(...composeUpdatedTeamContext(context.updatedTeam));

        return composition;
    }

    override composeSubject(context: ChangeTeamContext, language: PromptBuilderLanguage) {
        switch (language) {
            case 'Dutch':
                return `We hebben je deelname in ${context.event.name} veranderd!`;

            default:
                return `Update on your participation in ${context.event.name}`;
        }
    }
}
