// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type EventPromptContext, composeEventPromptContext, generateEventPromptContext } from './generateEventPromptContext';
import { type UserPromptContext, composeUserPromptContext, generateUserPromptContext } from './generateUserPromptContext';
import { PromptBuilder } from './PromptBuilder';
import { dayjs } from '@lib/DateTime';

/**
 * Parameters expected by the `ApproveVolunteerPromptBuilder` class.
 */
interface ApproveVolunteerParams {
    event: string;
}

/**
 * Context collected by the `ApproveVolunteerPromptBuilder` class.
 */
interface ApproveVolunteerContext {
    event: EventPromptContext;
    user: UserPromptContext;
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
            event: await generateEventPromptContext(params.event),
            user: await generateUserPromptContext(userId, params.event),
        }
    }

    override async collectExampleContext(userId: number): Promise<ApproveVolunteerContext> {
        return {
            event: {
                name: 'AnimeCon Unicorn Edition',
                location: 'The Unicorn Hotel in Rotterdam',
                startTime: dayjs().add(100, 'days'),
                endTime: dayjs().add(102, 'days'),
            },
            user: await generateUserPromptContext(userId),
        }
    }

    override composeContext(context: ApproveVolunteerContext): string[] {
        const composition: string[] = [];

        composition.push(...composeUserPromptContext(context.user));
        composition.push(...composeEventPromptContext(context.event));

        return composition;
    }
}
