// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type EventContext, composeEventContext, generateEventContext } from './generateEventContext';
import { type UserContext, composeUserContext, generateUserContext } from './generateUserContext';
import { PromptBuilder } from './PromptBuilder';
import { dayjs } from '@lib/DateTime';

/**
 * Parameters expected by the `RejectVolunteerPromptBuilder` class.
 */
interface RejectVolunteerParams {
    event: string;
}

/**
 * Context collected by the `RejectVolunteerPromptBuilder` class.
 */
interface RejectVolunteerContext {
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
            event: await generateEventContext(params.event),
            user: await generateUserContext(userId, params.event),
        }
    }

    override async collectExampleContext(userId: number): Promise<RejectVolunteerContext> {
        return {
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

        return composition;
    }
}
