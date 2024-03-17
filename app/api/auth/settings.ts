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
    request: z.object({
        /**
         * Whether the user should be shown information from other teams in the scheduling tools.
         */
        adminScheduleDisplayOtherTeams: z.boolean().optional(),
    }),
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
 * API that allows users to change their user settings.
 */
export async function settings(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        noAccess();

    const settingsToUpdate: { [k in keyof UserSettingsMap]?: UserSettingsMap[k] } = {};
    if (typeof request.adminScheduleDisplayOtherTeams === 'boolean') {
        settingsToUpdate['user-admin-schedule-display-other-teams'] =
            request.adminScheduleDisplayOtherTeams;
    }

    if (!Object.keys(settingsToUpdate).length)
        return { success: true };

    await writeUserSettings(props.user.userId, settingsToUpdate as any);
    return { success: true };
}
