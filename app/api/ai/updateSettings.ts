// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { writeSetting, writeSettings } from '@lib/Settings';

/**
 * Interface definition for the Generative AI API, exposed through /api/ai.
 */
export const kUpdateAiSettingsDefinition = z.object({
    request: z.object({
        /**
         * Personality that should be updated.
         */
        personality: z.string().optional(),

        /**
         * Prompts that should be updated.
         */
        prompts: z.object({
            'gen-ai-prompt-approve-volunteer': z.string(),
            'gen-ai-prompt-cancel-participation': z.string(),
            'gen-ai-prompt-change-team': z.string(),
            'gen-ai-prompt-reinstate-participation': z.string(),
            'gen-ai-prompt-reject-volunteer': z.string(),
        }).optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the settings were updated successfully.
         */
        success: z.boolean(),
    }),
});

export type UpdateAiSettingsDefinition = ApiDefinition<typeof kUpdateAiSettingsDefinition>;

type Request = ApiRequest<typeof kUpdateAiSettingsDefinition>;
type Response = ApiResponse<typeof kUpdateAiSettingsDefinition>;

/**
 * API that allows AI-related settings to be updated.
 */
export async function updateSettings(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        permission: 'system.internals.ai',
    });

    if (request.personality) {
        await writeSetting('gen-ai-personality', request.personality);
        await Log({
            type: LogType.AdminUpdateAiSetting,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                setting: 'personality',
            },
        });
    }

    if (request.prompts) {
        await writeSettings({
            'gen-ai-prompt-approve-volunteer': request.prompts['gen-ai-prompt-approve-volunteer'],
            'gen-ai-prompt-cancel-participation':
                request.prompts['gen-ai-prompt-cancel-participation'],
            'gen-ai-prompt-change-team': request.prompts['gen-ai-prompt-change-team'],
            'gen-ai-prompt-reinstate-participation':
                request.prompts['gen-ai-prompt-reinstate-participation'],
            'gen-ai-prompt-reject-volunteer': request.prompts['gen-ai-prompt-reject-volunteer'],
        });

        await Log({
            type: LogType.AdminUpdateAiSetting,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                setting: 'prompts',
            },
        });
    }

    return { success: true };
}
