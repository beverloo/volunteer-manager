// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { ApproveVolunteerPromptBuilder } from './prompts/ApproveVolunteerPromptBuilder';
import { CancelParticipationVolunteerPromptBuilder } from './prompts/CancelParticipationPromptBuilder';
import { ChangeTeamPromptBuilder } from './prompts/ChangeTeamPromptBuilder';
import { PromptBuilder } from './prompts/PromptBuilder';
import { ReinstateParticipationVolunteerPromptBuilder } from './prompts/ReinstateParticipationPromptBuilder';
import { RejectVolunteerPromptBuilder } from './prompts/RejectVolunteerPromptBuilder';
import { executeAccessCheck, or } from '@lib/auth/AuthenticationContext';

import { createVertexAIClient } from '@lib/integrations/vertexai';
import { ApproveApplicationPrompt } from './prompts/ApproveApplicationPrompt';

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

        /**
         * Parameters that can be passed when the `type` equals `cancel-participation`.
         */
        cancelParticipation: z.object({
            userId: z.number(),
            event: z.string(),
            team: z.string(),
        }).optional(),

        /**
         * Parameters that can be passed when the `type` equals `change-team`.
         */
        changeTeam: z.object({
            userId: z.number(),
            event: z.string(),
            currentTeam: z.string(),
            updatedTeam: z.string(),
        }).optional(),

        /**
         * Parameters that can be passed when the `type` equals `reinstate-participation`.
         */
        reinstateParticipation: z.object({
            userId: z.number(),
            event: z.string(),
            team: z.string(),
        }).optional(),

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
         * Information that went into the prompt that is about to be executed. Will only be in the
         * response when explicitly requested for it to be included.
         */
        newPrompt: z.object({
            /**
             * Context that was collected in order to power the prompt.
             */
            context: z.record(z.string(), z.any()),

            /**
             * Message that was compiled to be shared with the Vertex AI API.
             */
            message: z.array(z.string()),

            /**
             * Parameters that were given in order to power the prompt.
             */
            params: z.record(z.string(), z.any()),

        }).optional(),

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

export type GeneratePromptDefinition = ApiDefinition<typeof kGeneratePromptDefinition>;

type Request = ApiRequest<typeof kGeneratePromptDefinition>;
type Response = ApiResponse<typeof kGeneratePromptDefinition>;

/**
 * API that allows AI-related settings to be updated.
 */
export async function generatePrompt(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        notFound();

    const userId = props.user.userId;

    let generator: PromptBuilder<any, any>;
    switch (request.type) {
        case 'approve-volunteer': {
            if (!request.approveVolunteer)
                notFound();

            const prompt = new ApproveApplicationPrompt({
                event: request.approveVolunteer.event,
                language: request.language,
                sourceUserId: props.user.userId,
                targetUserId: request.approveVolunteer.userId,
                team: request.approveVolunteer.team,
            });

            const client = await createVertexAIClient();

            const newPrompt = await prompt.generateInput();
            const result = await prompt.generate(client);

            return {
                success: true,
                newPrompt,  // TODO: Rename to `prompt`
                result: {
                    subject: 'unknown',
                    message: result,
                },
            };
        }

        case 'cancel-participation':
            generator = new CancelParticipationVolunteerPromptBuilder(
                userId, request.cancelParticipation);
            break;

        case 'change-team':
            generator = new ChangeTeamPromptBuilder(userId, request.changeTeam);
            break;

        case 'reinstate-participation':
            generator = new ReinstateParticipationVolunteerPromptBuilder(
                userId, request.reinstateParticipation);
            break;

        case 'reject-volunteer':
            executeAccessCheck(props.authenticationContext, {
                check: 'admin',
                permission: or('system.internals.ai', {
                    permission: 'event.applications',
                    operation: 'update',
                    scope: {
                        event: request.approveVolunteer?.event,
                        team: request.approveVolunteer?.team,
                    },
                }),
            });

            generator = new RejectVolunteerPromptBuilder(userId, request.rejectVolunteer);
            break;

        default:
            return { success: false, error: 'This type of prompt is not yet supported.' };
    }

    // Install personality and prompt overrides when provided. This feature is only accessible
    // through the Generative AI Explorer pages, and relies on a special permission.
    if (request.overrides && props.access.can('system.internals.ai'))
        generator.setOverrides(request.overrides.personality, request.overrides.prompt);

    const { context, prompt, subject } = await generator.build(request.language);

    const client = await createVertexAIClient();

    const rawMessage = await client.predictText({ prompt }) ?? '[unable to generate message]';
    const message = rawMessage.replaceAll(/\n>[ ]*/g, '\n').replace(/^>\s*/, '');

    return { success: true, context, prompt, result: { subject, message } };
}
