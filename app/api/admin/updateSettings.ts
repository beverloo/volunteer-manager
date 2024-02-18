// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { writeSettings } from '@lib/Settings';

/**
 * Interface definition for the Settings API, exposed through /api/admin/update-settings.
 */
export const kUpdateSettingsDefinition = z.object({
    request: z.object({
        /**
         * The settings that should be updated. At least one.
         */
        settings: z.array(z.object({
            /**
             * Name of the setting to update.
             */
            setting: z.string(),

            /**
             * Value that the setting should be set to.
             */
            value: z.number().or(z.string().min(1)),

        })).min(1),
    }),
    response: z.strictObject({
        /**
         * Whether the API call was able to execute successfully.
         */
        success: z.boolean(),
    }),
});

export type UpdateSettingsDefinition = ApiDefinition<typeof kUpdateSettingsDefinition>;

type Request = ApiRequest<typeof kUpdateSettingsDefinition>;
type Response = ApiResponse<typeof kUpdateSettingsDefinition>;

/**
 * API that allows arbitrary settings to be updated. Only available to system administrators.
 */
export async function updateSettings(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        privilege: Privilege.SystemAdministrator,
    });

    const settings: { [k: string]: number | string } = { /* will be composed */ };
    for (const { setting, value } of request.settings)
        settings[setting] = value;

    await writeSettings(settings as any);
    await Log({
        type: LogType.AdminUpdateSettings,
        severity: LogSeverity.Warning,
        sourceUser: props.user,
        data: settings,
    });

    return { success: true };
}