// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { RecordLog, kLogType } from '@lib/Log';
import { executeServerAction } from '@lib/serverAction';
import { clearEnvironmentCache } from '@lib/Environment';
import { clearPageMetadataCache } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEnvironments, tTeams } from '@lib/database';

import { kEnvironmentPurpose } from '@lib/database/Types';

/**
 * Zod type that describes information required in order to update an environment.
 */
const kUpdateEnvironmentData = z.object({
    colorDarkMode: z.string().regex(/^#([0-9a-f]){6}$/i),
    colorLightMode: z.string().regex(/^#([0-9a-f]){6}$/i),
    description: z.string().nonempty(),
    // domain is deliberately omitted
    purpose: z.nativeEnum(kEnvironmentPurpose),
    title: z.string().nonempty(),
});

/**
 * Server action that updates environment information for the one identified by the given `userId`.
 */
export async function updateEnvironment(environmentId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kUpdateEnvironmentData, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: 'organisation.environments',
        });

        const affectedRows = await db.update(tEnvironments)
            .set({
                environmentColourDarkMode: data.colorDarkMode,
                environmentColourLightMode: data.colorLightMode,
                environmentDescription: data.description,
                environmentPurpose: data.purpose,
                environmentTitle: data.title,
            })
            .where(tEnvironments.environmentId.equals(environmentId))
            .executeUpdate();

        if (!affectedRows)
            return { success: false, error: 'Unable to update the environment in the database…' };

        RecordLog({
            type: kLogType.AdminUpdateEnvironment,
            sourceUser: props.user,
            data: {
                environmentId,
            },
        });

        clearEnvironmentCache();
        clearPageMetadataCache('environment');

        return { success: true, refresh: true };
    });
};

/**
 * Zod type that describes information required in order to update a team.
 */
const kUpdateTeamData = z.object({
    colorDarkMode: z.string().regex(/^#([0-9a-f]){6}$/i),
    colorLightMode: z.string().regex(/^#([0-9a-f]){6}$/i),
    description: z.string().nonempty(),
    environment: z.number(),
    name: z.string().nonempty(),
    plural: z.string().nonempty(),
    // slug is deliberately omitted
    title: z.string().nonempty(),

    managesFaq: z.boolean(),
    managesFirstAid: z.boolean(),
    managesSecurity: z.boolean(),
    requestConfirmation: z.boolean(),
});

/**
 * Server action that updates team information for the one identified by the given `teamId`.
 */
export async function updateTeam(teamId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kUpdateTeamData, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: 'organisation.teams',
        });

        const affectedRows = await db.update(tTeams)
            .set({
                teamColourDarkTheme: data.colorDarkMode,
                teamColourLightTheme: data.colorLightMode,
                teamDescription: data.description,
                teamEnvironmentId: data.environment,
                teamName: data.name,
                teamPlural: data.plural,
                teamTitle: data.title,

                teamManagesFaq: !!data.managesFaq ? 1 : 0,
                teamManagesFirstAid: !!data.managesFirstAid ? 1 : 0,
                teamManagesSecurity: !!data.managesSecurity ? 1 : 0,
                teamRequestConfirmation: !!data.requestConfirmation ? 1 : 0,
            })
            .where(tTeams.teamId.equals(teamId))
            .executeUpdate();

        if (!affectedRows)
            return { success: false, error: 'Unable to update the team in the database…' };

        RecordLog({
            type: kLogType.AdminUpdateTeam,
            sourceUser: props.user,
            data: {
                team: data.title,
            },
        });

        clearEnvironmentCache();
        clearPageMetadataCache('team');

        return { success: true, refresh: true };
    });
}
