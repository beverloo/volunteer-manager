// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type ApplicationContext, composeApplicationContext, generateApplicationContext } from './generateApplicationContext';
import { type EventContext, composeEventContext, generateEventContext } from './generateEventContext';
import { type PromptBuilderLanguage, PromptBuilder } from './PromptBuilder';
import { type UserContext, composeUserContext, generateUserContext } from './generateUserContext';
import { dayjs } from '@lib/DateTime';

/**
 * Parameters expected by the `ApproveVolunteerPromptBuilder` class.
 */
interface ApproveVolunteerParams {
    userId: number;
    event: string;
    team: string;
}

/**
 * Context collected by the `ApproveVolunteerPromptBuilder` class.
 */
interface ApproveVolunteerContext {
    application: ApplicationContext;
    event: EventContext;
    user: UserContext;
}

/**
 * Prompt generator for the situation in which a volunteer's application has been approved, and we
 * want to share the news with them.
 */
export class ApproveVolunteerPromptBuilder extends
    PromptBuilder<ApproveVolunteerParams, ApproveVolunteerContext>
{
    constructor(userId: number, params?: ApproveVolunteerParams) {
        super(userId, params, 'gen-ai-prompt-approve-volunteer');
    }

    // ---------------------------------------------------------------------------------------------
    // PromptBuilder implementation:
    // ---------------------------------------------------------------------------------------------

    override async collectContext(userId: number, params: ApproveVolunteerParams)
        : Promise<ApproveVolunteerContext>
    {
        return {
            application: await generateApplicationContext(params.userId, params.event, params.team),
            event: await generateEventContext(params.event),
            user: await generateUserContext(userId, params.event),
        }
    }

    override async collectExampleContext(userId: number): Promise<ApproveVolunteerContext> {
        return {
            application: {
                event: 'acon-classic',
                firstName: 'Joe',
                teamName: 'Festival Hosts',
                teamDescription: 'Festival Hosts [guide](#) visitors to where they need to be.',
                team: 'hosts.team',
            },
            event: {
                name: 'AnimeCon Unicorn Edition',
                location: 'The Unicorn Hotel in Rotterdam',
                startTime: dayjs().add(100, 'days'),
                endTime: dayjs().add(102, 'days'),
            },
            user: await generateUserContext(userId),
        }
    }

    override composeContext(context: ApproveVolunteerContext): string[] {
        const composition: string[] = [];

        composition.push(...composeUserContext(context.user));
        composition.push(...composeEventContext(context.event));
        composition.push(...composeApplicationContext(context.application, /* approved= */ true));

        return composition;
    }

    override composeSubject(context: ApproveVolunteerContext, language: PromptBuilderLanguage) {
        switch (language) {
            case 'Dutch':
                return `Aanmelding voor ${context.event.name}`;

            case 'English':
            case 'French':
            case 'German':
            case 'Japanese':
            case 'Spanish':
                return `Your ${context.event.name} application`;
        }
    }
}
