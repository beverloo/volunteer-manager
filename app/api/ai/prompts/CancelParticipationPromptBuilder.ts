// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type ParticipationContext, composeParticipationContext, generateParticipationContext } from './generateParticipationContext';
import { type EventContext, composeEventContext, generateEventContext } from './generateEventContext';
import { type PromptBuilderLanguage, PromptBuilder } from './PromptBuilder';
import { type UserContext, composeUserContext, generateUserContext } from './generateUserContext';
import { dayjs } from '@lib/DateTime';

/**
 * Parameters expected by the `CancelParticipationVolunteerPromptBuilder` class.
 */
interface CancelParticipationParams {
    userId: number;
    event: string;
    team: string;
}

/**
 * Context collected by the `CancelParticipationVolunteerPromptBuilder` class.
 */
interface CancelParticipationContext {
    participation: ParticipationContext;
    event: EventContext;
    user: UserContext;
}

/**
 * Prompt generator for the situation in which a volunteer has had their participation cancelled. We
 * do not include the reason for the cancellation as it may be personal.
 */
export class CancelParticipationVolunteerPromptBuilder extends
    PromptBuilder<CancelParticipationParams, CancelParticipationContext>
{
    constructor(userId: number, params?: CancelParticipationParams) {
        super(userId, params, 'gen-ai-prompt-cancel-participation');
    }

    // ---------------------------------------------------------------------------------------------
    // PromptBuilder implementation:
    // ---------------------------------------------------------------------------------------------

    override get dutchApplicationVerb() { return 'afmelding'; }

    override async collectContext(userId: number, params: CancelParticipationParams)
        : Promise<CancelParticipationContext>
    {
        return {
            participation:
                await generateParticipationContext(params.userId, params.event, params.team),
            event: await generateEventContext(params.event),
            user: await generateUserContext(userId, params.event),
        }
    }

    override async collectExampleContext(userId: number): Promise<CancelParticipationContext> {
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
                startTime: dayjs().add(40, 'days'),
                endTime: dayjs().add(42, 'days'),
            },
            user: await generateUserContext(userId),
        }
    }

    override composeContext(context: CancelParticipationContext): string[] {
        const composition: string[] = [];

        composition.push(...composeUserContext(context.user));
        composition.push(...composeEventContext(context.event));
        composition.push(...composeParticipationContext(context.participation, false));

        return composition;
    }

    override composeSubject(context: CancelParticipationContext, language: PromptBuilderLanguage) {
        switch (language) {
            case 'Dutch':
                return `Afmelding voor ${context.event.name}`;

            case 'English':
            case 'French':
            case 'German':
            case 'Japanese':
            case 'Spanish':
                return `Your ${context.event.name} participation has been cancelled`;
        }
    }
}
