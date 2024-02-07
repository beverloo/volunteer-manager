// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type ParticipationContext, composeParticipationContext, generateParticipationContext } from './generateParticipationContext';
import { type EventContext, composeEventContext, generateEventContext } from './generateEventContext';
import { type PromptBuilderLanguage, PromptBuilder } from './PromptBuilder';
import { type UserContext, composeUserContext, generateUserContext } from './generateUserContext';
import { Temporal } from '@lib/Temporal';

/**
 * Parameters expected by the `ReinstateParticipationVolunteerPromptBuilder` class.
 */
interface ReinstateParticipationParams {
    userId: number;
    event: string;
    team: string;
}

/**
 * Context collected by the `ReinstateParticipationVolunteerPromptBuilder` class.
 */
interface ReinstateParticipationContext {
    participation: ParticipationContext;
    event: EventContext;
    user: UserContext;
}

/**
 * Prompt generator for the situation in which a volunteer has had their participation cancelled,
 * but their circumstances changed once again and we've reinstated them in the team.
 */
export class ReinstateParticipationVolunteerPromptBuilder extends
    PromptBuilder<ReinstateParticipationParams, ReinstateParticipationContext>
{
    constructor(userId: number, params?: ReinstateParticipationParams) {
        super(userId, params, 'gen-ai-prompt-reinstate-participation');
    }

    // ---------------------------------------------------------------------------------------------
    // PromptBuilder implementation:
    // ---------------------------------------------------------------------------------------------

    override async collectContext(userId: number, params: ReinstateParticipationParams)
        : Promise<ReinstateParticipationContext>
    {
        return {
            participation:
                await generateParticipationContext(params.userId, params.event, params.team),
            event: await generateEventContext(params.event),
            user: await generateUserContext(userId, params.event),
        }
    }

    override async collectExampleContext(userId: number): Promise<ReinstateParticipationContext> {
        return {
            participation: {
                event: 'acon-classic',
                firstName: 'Joe',
                teamName: 'Festival Hosts',
                teamDescription: 'Festival Hosts [guide](#) visitors to where they need to be.',
                team: 'hosts.team',
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

    override composeContext(context: ReinstateParticipationContext): string[] {
        const composition: string[] = [];

        composition.push(...composeUserContext(context.user));
        composition.push(...composeEventContext(context.event));
        composition.push(...composeParticipationContext(context.participation, true));

        return composition;
    }

    override composeSubject(context: ReinstateParticipationContext, language: PromptBuilderLanguage)
    {
        switch (language) {
            case 'Dutch':
                return `(Her)aanmelding voor ${context.event.name}!`;

            case 'English':
            case 'French':
            case 'German':
            case 'Japanese':
            case 'Spanish':
                return `Your ${context.event.name} participation has been reinstated`;
        }
    }
}
