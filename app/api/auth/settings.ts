// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { noAccess, type ActionProps } from '../Action';
import { writeUserSettings, type UserSettingsMap } from '@lib/UserSettings';

/**
 * Interface definition for the Settings API, exposed through /api/auth/settings.
 */
export const kSettingsDefinition = z.object({
    /**
     * Input is any key-value pair that resolves to a known user setting.
     */
    request: z.record(z.string(), z.any()),
    response: z.strictObject({
        /**
         * Whether the setting(s) were updated successfully.
         */
        success: z.boolean(),

        /**
         * The error message that occurred when `success` is not set to true.
         */
        error: z.string().optional(),
    }),
});

export type SettingsDefinition = ApiDefinition<typeof kSettingsDefinition>;

type Request = ApiRequest<typeof kSettingsDefinition>;
type Response = ApiResponse<typeof kSettingsDefinition>;

/**
 * The string representation of the type expected for the setting named `Key`.
 */
type SettingStringType<Key extends keyof UserSettingsMap> =
    UserSettingsMap[Key] extends boolean ? 'boolean'
        : UserSettingsMap[Key] extends number ? 'number'
        : UserSettingsMap[Key] extends string ? 'string' : 'unknown';

/**
 * API that allows users to change their user settings.
 */
export async function settings(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        noAccess();

    // User settings that are allowed to be updated using this interface.
    const kAllowedUserSettings: { [k in keyof UserSettingsMap]: SettingStringType<k> } = {
        'user-admin-knowledge-expand-categories': 'boolean',
        'user-admin-schedule-date': 'string',
        'user-admin-schedule-expand-warnings': 'boolean',
        'user-admin-schedule-inclusive-shifts': 'boolean',
        'user-admin-shifts-display-other-teams': 'boolean',
        'user-admin-shifts-expand-shifts': 'boolean',
        'user-admin-volunteers-columns-filter': 'string',
        'user-admin-volunteers-columns-hidden': 'string',
        'user-admin-volunteers-expand-shifts': 'boolean',
    };

    const settingsToUpdate: { [k in keyof UserSettingsMap]?: UserSettingsMap[k] } = {};
    for (const [ setting, value ] of Object.entries(request)) {
        if (!Object.hasOwn(kAllowedUserSettings, setting)) {
            console.error(`Unrecognised setting: ${setting}`);
            continue;
        }

        if (typeof value !== kAllowedUserSettings[setting as keyof UserSettingsMap]) {
            console.error(`Invalid setting value type: ${setting}, ${value}`);
            continue;
        }

        settingsToUpdate[setting as keyof UserSettingsMap] = value;
    }

    if (!!Object.keys(settingsToUpdate).length)
        await writeUserSettings(props.user.userId, settingsToUpdate as any);

    return { success: true };
}
