// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type ApplicationContext, composeApplicationContext, generateApplicationContext } from './generateApplicationContext';
import { type EventContext, composeEventContext, generateEventContext } from './generateEventContext';
import { type UserContext, composeUserContext, generateUserContext } from './generateUserContext';
import { PromptBuilder } from './PromptBuilder';
import { dayjs } from '@lib/DateTime';

/**
 * Parameters expected by the `RejectVolunteerPromptBuilder` class.
 */
interface RejectVolunteerParams {
    userId: number;
    event: string;
    team: string;
}

/**
 * Context collected by the `RejectVolunteerPromptBuilder` class.
 */
interface RejectVolunteerContext {
    application: ApplicationContext;
    event: EventContext;
    user: UserContext;
}

/**
 * Prompt generator for the situation in which a volunteer's application has been rejected, and we
 * have to tell them the sad news.
 */
export class RejectVolunteerPromptBuilder extends
    PromptBuilder<RejectVolunteerParams, RejectVolunteerContext>
{
    constructor(userId: number, params?: RejectVolunteerParams) {
        super(userId, params, 'gen-ai-prompt-reject-volunteer');
    }

    // ---------------------------------------------------------------------------------------------
    // PromptBuilder implementation:
    // ---------------------------------------------------------------------------------------------

    override async collectContext(userId: number, params: RejectVolunteerParams)
        : Promise<RejectVolunteerContext>
    {
        return {
            application: await generateApplicationContext(params.userId, params.event, params.team),
            event: await generateEventContext(params.event),
            user: await generateUserContext(userId, params.event),
        }
    }

    override async collectExampleContext(userId: number): Promise<RejectVolunteerContext> {
        return {
            application: {
                event: 'acon-classic',
                firstName: 'Joe',
                teamName: 'Festival Hosts',
                teamDescription: 'Festival Hosts guide visitors to where they need to be.',
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

    override composeContext(context: RejectVolunteerContext): string[] {
        const composition: string[] = [];

        composition.push(...composeUserContext(context.user));
        composition.push(...composeEventContext(context.event));
        composition.push(...composeApplicationContext(context.application, /* approved= */ false));

        return composition;
    }
}
