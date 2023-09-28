// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type EventPromptContext, composeEventPromptContext, generateEventPromptContext } from './generateEventPromptContext';
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
    event: EventPromptContext;
}

/**
 * Prompt generator for the situation in which a volunteer's application has been rejected, and we
 * have to tell them the sad news.
 */
export class RejectVolunteerPromptBuilder extends
    PromptBuilder<RejectVolunteerParams, RejectVolunteerContext>
{
    constructor(params?: RejectVolunteerParams) {
        super(params, 'gen-ai-prompt-reject-volunteer');
    }

    // ---------------------------------------------------------------------------------------------
    // PromptBuilder implementation:
    // ---------------------------------------------------------------------------------------------

    override async collectContext(params: RejectVolunteerParams)
        : Promise<RejectVolunteerContext>
    {
        return {
            event: await generateEventPromptContext(params.event),
        }
    }

    override collectExampleContext(): RejectVolunteerContext {
        return {
            event: {
                name: 'AnimeCon Classic',
                location: 'Theaterhotel in Almelo',
                startTime: dayjs().add(40, 'days'),
                endTime: dayjs().add(42, 'days'),
            },
        }
    }

    override composeContext(context: RejectVolunteerContext): string[] {
        const composition: string[] = [];

        composition.push(...composeEventPromptContext(context.event));

        return composition;
    }
}
