// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod/v4';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import type { Prompt } from './prompts/Prompt';
import { ApproveApplicationPrompt } from './prompts/ApproveApplicationPrompt';
import { CancelParticipationPrompt } from './prompts/CancelParticipationPrompt';
import { ReinstateParticipationPrompt } from './prompts/ReinstateParticipationPrompt';
import { RejectApplicationPrompt } from './prompts/RejectApplicationPrompt';
import { RemindParticipationPrompt } from './prompts/RemindParticipationPrompt';
import { TeamChangePrompt } from './prompts/TeamChangePrompt';
import { createVertexAIClient } from '@lib/integrations/vertexai';

import { kSupportedLanguages } from './languages';

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
            'remind-participation',
        ]),

        /**
         * In which language should the prompt be written?
         */
        language: z.enum(kSupportedLanguages),

        /**
         * Optional overrides that may be provided by Ai administrators. Only used for the prompt
         * exploration pages, to make testing new prompts easier.
         */
        overrides: z.object({
            intention: z.string(),
            systemInstructions: z.string(),
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

        /**
         * Parameters that can be passed when the `type` equals `remind-participation`.
         */
        remindParticipation: z.object({
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
        prompt: z.object({
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

    let intention: string | undefined;
    let systemInstructions: string | undefined;

    // Apply overrides when this prompt has been powered through the internal AI Explorer pages,
    // which exist for purposes of finetuning specific prompts.
    if (request.overrides && props.access.can('system.internals.ai')) {
        intention = request.overrides.intention;
        systemInstructions = request.overrides.systemInstructions;
    }

    // The prompt that should be executed, which is specific to the |request|'s type.
    let prompt: Prompt<any, any> | undefined;

    switch (request.type) {
        case 'approve-volunteer':
            if (!request.approveVolunteer)
                notFound();

            prompt = new ApproveApplicationPrompt({
                event: request.approveVolunteer.event,
                intention,
                language: request.language,
                sourceUserId: props.user.userId,
                systemInstructions,
                targetUserId: request.approveVolunteer.userId,
                team: request.approveVolunteer.team,
            });

            break;

        case 'cancel-participation':
            if (!request.cancelParticipation)
                notFound();

            prompt = new CancelParticipationPrompt({
                event: request.cancelParticipation.event,
                intention,
                language: request.language,
                sourceUserId: props.user.userId,
                systemInstructions,
                targetUserId: request.cancelParticipation.userId,
                team: request.cancelParticipation.team,
            });

            break;

        case 'change-team':
            if (!request.changeTeam)
                notFound();

            prompt = new TeamChangePrompt({
                event: request.changeTeam.event,
                intention,
                language: request.language,
                sourceUserId: props.user.userId,
                systemInstructions,
                targetUserId: request.changeTeam.userId,
                team: request.changeTeam.currentTeam,
                updatedTeam: request.changeTeam.updatedTeam,
            });

            break;

        case 'reinstate-participation':
            if (!request.reinstateParticipation)
                notFound();

            prompt = new ReinstateParticipationPrompt({
                event: request.reinstateParticipation.event,
                intention,
                language: request.language,
                sourceUserId: props.user.userId,
                systemInstructions,
                targetUserId: request.reinstateParticipation.userId,
                team: request.reinstateParticipation.team,
            });

            break;

        case 'reject-volunteer':
            if (!request.rejectVolunteer)
                notFound();

            prompt = new RejectApplicationPrompt({
                event: request.rejectVolunteer.event,
                intention,
                language: request.language,
                sourceUserId: props.user.userId,
                systemInstructions,
                targetUserId: request.rejectVolunteer.userId,
                team: request.rejectVolunteer.team,
            });

            break;

        case 'remind-participation':
            if (!request.remindParticipation)
                notFound();

            prompt = new RemindParticipationPrompt({
                event: request.remindParticipation.event,
                intention,
                language: request.language,
                sourceUserId: props.user.userId,
                systemInstructions,
                targetUserId: request.remindParticipation.userId,
                team: request.remindParticipation.team,
            });

            break;

        default:
            return { success: false, error: 'This type of prompt is not yet supported.' };
    }

    const client = await createVertexAIClient();
    const result = await prompt!.generate(client);

    return {
        success: true,
        prompt: {
            context: result.context,
            message: result.message,
            params: result.params,
        },
        result: {
            subject: result.subject,
            message: result.result,
        },
    };
}
