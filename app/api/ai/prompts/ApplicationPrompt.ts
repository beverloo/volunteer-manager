// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { TeamEventPrompt, type TeamEventPromptContext } from './TeamEventPrompt';
import { formatDate } from '@lib/Temporal';

/**
 * Prompt that can be used to convey to a volunteer that their application has been updated.
 */
export abstract class ApplicationPrompt extends TeamEventPrompt {
    override composeMessage(context: TeamEventPromptContext): string[] {
        const message = super.composeMessage(context);
        message.push(
            `They signed up to help out with the ${context.event.shortName} festival, requesting ` +
                `to join the ${context.team.name} team.`);

        if (context.event.startTime && context.event.endTime) {
            message.push(
                `The festival starts on ${formatDate(context.event.startTime, 'YYYY-MM-DD')}, ` +
                    `and ends on ${formatDate(context.event.endTime, 'YYYY-MM-DD')}.`);
        }

        if (context.event.location) {
            message.push(`The festival will take place in ${context.event.location}.`);
        }

        return message;
    }
}
