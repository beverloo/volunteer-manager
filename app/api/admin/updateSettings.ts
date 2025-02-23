// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
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
            value: z.boolean().or(z.number().or(z.string())),

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
        permission: 'system.internals.settings',
    });

    const settings: { [k: string]: boolean | number | string } = { /* will be composed */ };
    for (const { setting, value } of request.settings)
        settings[setting] = value;

    const roundToZeroSettings = [ 'display-time-offset-seconds', 'schedule-time-offset-seconds' ];
    for (const setting of roundToZeroSettings) {
        if (!Object.hasOwn(settings, setting) || typeof settings[setting] !== 'number')
            continue;  // the setting is not being updated

        if (Math.abs(settings[setting] as number) > 60)
            continue;  // the setting has a real value

        settings[setting] = 0;
    }

    await writeSettings(settings as any);
    RecordLog({
        type: kLogType.AdminUpdateSettings,
        severity: kLogSeverity.Warning,
        sourceUser: props.user,
        data: settings,
    });

    return { success: true };
}
