// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../Action';
import { ApproveVolunteerPromptBuilder } from './prompts/ApproveVolunteerPromptBuilder';
import { Privilege, can } from '@lib/auth/Privileges';
import { PromptBuilder } from './prompts/PromptBuilder';
import { RejectVolunteerPromptBuilder } from './prompts/RejectVolunteerPromptBuilder';
import { executeAccessCheck, or } from '@lib/auth/AuthenticationContext';

import { createVertexAIClient } from '@lib/integrations/vertexai';

/**
 * Interface definition for the Generative AI API, exposed through /api/ai.
 */
export const kGeneratePromptDefinition = z.object({
    request: z.object({
        /**
         * Type of prompt that is being generated. Conveyed in the URL.
         */
        type: z.enum([
            'approve-volunteer',
            'cancel-participation',
            'change-team',
            'reinstate-participation',
            'reject-volunteer',
        ]),

        /**
         * In which language should the prompt be written?
         */
        language: z.enum([ 'Dutch', 'English', 'French', 'German', 'Japanese', 'Spanish' ]),

        /**
         * Optional overrides that may be provided by Ai administrators. Only used for the prompt
         * exploration pages, to make testing new prompts easier.
         */
        overrides: z.object({
            personality: z.string(),
            prompt: z.string(),
        }).optional(),

        /**
         * Parameters that can be passed when the `type` equals `approve-volunteer`.
         */
        approveVolunteer: z.object({
            userId: z.number(),
            event: z.string(),
            team: z.string(),
        }).optional(),

        // TODO: cancel-participation
        // TODO: change-team
        // TODO: reinstate-participation

        /**
         * Parameters that can be passed when the `type` equals `reject-volunteer`.
         */
        rejectVolunteer: z.object({
            userId: z.number(),
            event: z.string(),
            team: z.string(),
        }).optional(),

    }),
    response: z.strictObject({
        /**
         * Whether the prompt could be generated successfully.
         */
        success: z.boolean(),

        // -----------------------------------------------------------------------------------------
        // Success case:
        // -----------------------------------------------------------------------------------------

        /**
         * In case of success, the context that was considered in this generated prompt.
         */
        context: z.array(z.string()).optional(),

        /**
         * In case of success, the prompt that was used to generate the message.
         */
        prompt: z.string().optional(),

        /**
         * Result of the generated prompt. Split between an optional subject and a message.
         */
        result: z.strictObject({
            /**
             * The subject that should be associated with the generated message.
             */
            subject: z.string().optional(),

            /**
             * The message that was generated by this prompt.
             */
            message: z.string(),

        }).optional(),

        // -----------------------------------------------------------------------------------------
        // Failure case:
        // -----------------------------------------------------------------------------------------

        /**
         * In case of error, a textual description of what went wrong.
         */
        error: z.string().optional(),
    }),
});

export type GeneratePromptDefinition = z.infer<typeof kGeneratePromptDefinition>;

type Request = GeneratePromptDefinition['request'];
type Response = GeneratePromptDefinition['response'];

/**
 * API that allows AI-related settings to be updated.
 */
export async function generatePrompt(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        notFound();

    const userId = props.user.userId;

    let generator: PromptBuilder<any, any>;
    switch (request.type) {
        case 'approve-volunteer':
            executeAccessCheck(props.authenticationContext, {
                check: 'admin',
                privilege: or(Privilege.EventApplicationManagement, Privilege.SystemAiAccess),
            });

            generator = new ApproveVolunteerPromptBuilder(userId, request.approveVolunteer);
            break;

            // TODO: cancel-participation
            // TODO: change-team
            // TODO: reinstate-participation

        case 'reject-volunteer':
            executeAccessCheck(props.authenticationContext, {
                check: 'admin',
                privilege: or(Privilege.EventApplicationManagement, Privilege.SystemAiAccess),
            });

            generator = new RejectVolunteerPromptBuilder(userId, request.rejectVolunteer);
            break;

        default:
            return { success: false, error: 'This type of prompt is not yet supported.' };
    }

    // Install personality and prompt overrides when provided. This feature is only accessible
    // through the Generative AI Explorer pages, and relies on a special permission.
    if (request.overrides && can(props.user, Privilege.SystemAiAccess))
        generator.setOverrides(request.overrides.personality, request.overrides.prompt);

    const { context, prompt } = await generator.build(request.language);

    const client = await createVertexAIClient();

    const subject = generator.subject;
    const message = await client.predictText(prompt) ?? '[unable to generate message]';

    return { success: true, context, prompt, result: { subject, message } };
}
