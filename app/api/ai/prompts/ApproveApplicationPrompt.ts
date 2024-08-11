// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { ApplicationPrompt } from './ApplicationPrompt';

import type { TeamEventPromptContext, TeamEventPromptParams } from './TeamEventPrompt';

/**
 * Prompt that can be used to convey to a volunteer that their application has been approved.
 */
export class ApproveApplicationPrompt extends ApplicationPrompt {
    constructor(params: TeamEventPromptParams) {
        super('gen-ai-intention-approve-volunteer', params);
    }

    override async composeMessage(context: TeamEventPromptContext): Promise<string[]> {
        const message = await super.composeMessage(context);

        if (context.intention?.length)
            message.push(...context.intention.split('\n'));

        if (context.targetUser.role) {
            message.push(
                `Explain that, as a ${context.targetUser.role}, their expected to ` +
                `${context.team.description}.`);

            if (context.targetUser.hotelEligible) {
                message.push(
                    `As a ${context.targetUser.role}, they are able to book a hotel room through ` +
                    'us at a discounted rate.');
            }

            if (context.targetUser.trainingEligible) {
                message.push(
                    `As a ${context.targetUser.role}, we invite them to join our professional ` +
                    'training, focused on communication skills and receiving a BLS-AED ' +
                    'certification.');
            }
        }

        message.push(
            'They will be able to share their preferences regarding participation on: ' +
            `https://${context.team.domain}/registration/${context.team.domainSlug}/application`)

        if (context.team.whatsApp) {
            message.push(
                `They are welcome to join our private WhatsApp group on ${context.team.whatsApp}`);
        }

        if (context.team.requestConfirmation) {
            message.push(
                'They are kindly requested to respond to this message to confirm rececipt.');
        }

        message.push('They can respond to this message with any further questions they may have.');

        return message;
    }
}
