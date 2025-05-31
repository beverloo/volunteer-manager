// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { RecordLog, kLogType } from '@lib/Log';
import { executeServerAction } from '@lib/serverAction';
import { clearEnvironmentCache } from '@lib/Environment';
import { clearPageMetadataCache } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEnvironments, tTeams, tTeamsRoles } from '@lib/database';

import { kEnvironmentPurpose } from '@lib/database/Types';

/**
 * Zod type that describes that no data is expected.
 */
const kNoDataRequired = z.object({ /* no parameters */ });

/**
 * Zod type that describes information required in order to create a new environment.
 */
const kCreateEnvironmentData = z.object({
    domain: z.string().nonempty(),
});

/**
 * Server action that creates a new environment in the Volunteer Manager.
 */
export async function createEnvironment(formData: unknown) {
    'use server';
    return executeServerAction(formData, kCreateEnvironmentData, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: 'root',
        });

        const existingEnvironment = await db.selectFrom(tEnvironments)
            .where(tEnvironments.environmentDomain.equals(data.domain))
                .and(tEnvironments.environmentDeleted.isNull())
            .selectCountAll()
            .executeSelectNoneOrOne();

        if (!!existingEnvironment)
            return { success: false, error: 'An environment with that domain already exists…' };

        const environmentId = await db.insertInto(tEnvironments)
            .set({
                environmentColourDarkMode: '#ff0000',
                environmentColourLightMode: '#ff0000',
                environmentDescription: data.domain,
                environmentDomain: data.domain,
                environmentPurpose: kEnvironmentPurpose.Placeholder,
                environmentTitle: data.domain,
            })
            .returningLastInsertedId()
            .executeInsert();

        if (!environmentId)
            return { success: false, error: 'Unable to store the environment in the database…' };

        RecordLog({
            type: kLogType.AdminEnvironmentCreate,
            sourceUser: props.user,
            data: {
                id: environmentId,
                domain: data.domain,
            },
        });

        clearEnvironmentCache();

        return {
            success: true,
            redirect: `/admin/organisation/structure/environments/${data.domain}`,
        };
    });
}

/**
 * Zod type that describes information required in order to create a new team.
 */
const kCreateTeamData = z.object({
    environment: z.number(),
    name: z.string().nonempty(),
    plural: z.string().nonempty(),
    slug: z.string().nonempty(),
    title: z.string().nonempty(),
});

/**
 * Server action that creates a new team in the Volunteer Manager.
 */
export async function createTeam(formData: unknown) {
    'use server';
    return executeServerAction(formData, kCreateTeamData, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: 'root',
        });

        const existingEnvironment = await db.selectFrom(tEnvironments)
            .where(tEnvironments.environmentId.equals(data.environment))
                .and(tEnvironments.environmentDeleted.isNull())
            .selectOneColumn(tEnvironments.environmentDomain)
            .executeSelectNoneOrOne();

        if (!existingEnvironment)
            return { success: false, error: 'The given environment could not be found…' };

        const existingTeam = await db.selectFrom(tTeams)
            .where(tTeams.teamSlug.equals(data.slug))
            .selectCountAll()
            .executeSelectNoneOrOne();

        if (!!existingTeam)
            return { success: false, error: 'A team with that slug already exists…' };

        const teamId = await db.insertInto(tTeams)
            .set({
                teamSlug: data.slug,
                teamName: data.name,
                teamPlural: data.plural,
                teamTitle: data.title,
                teamDescription: data.title,
                teamEnvironment: existingEnvironment,
                teamEnvironmentId: data.environment,
                teamColourDarkTheme: '#ff0000',
                teamColourLightTheme: '#ff0000',
            })
            .returningLastInsertedId()
            .executeInsert();

        if (!teamId)
            return { success: false, error: 'Unable to store the new team in the database…' };

        // Set the default role for this team. Without this row created, it's not possible for
        // volunteers to be allocated to the team. The default role is "Crew", our generic crew
        // member role.
        {
            await db.insertInto(tTeamsRoles)
                .set({
                    teamId,
                    roleId: /* Crew= */ 1,
                    roleDefault: /* true= */ 1,
                })
                .executeInsert();
        }

        RecordLog({
            type: kLogType.AdminTeamCreate,
            sourceUser: props.user,
            data: {
                id: teamId,
                slug: data.slug,
                title: data.title,
            },
        });

        clearEnvironmentCache();

        return {
            success: true,
            redirect: `/admin/organisation/structure/${data.slug}`,
        };
    });
}

/**
 * Server action that deletes the environment identified by the given `environmentId`.
 */
export async function deleteEnvironment(environmentId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: 'root',  // only root can delete environments
        });

        const existingEnvironment = await db.selectFrom(tEnvironments)
            .where(tEnvironments.environmentId.equals(environmentId))
                .and(tEnvironments.environmentDeleted.isNull())
            .selectOneColumn(tEnvironments.environmentDomain)
            .executeSelectNoneOrOne();

        if (!existingEnvironment)
            return { success: false, error: 'The given environment could not be found…' };

        const dbInstance = db;
        const affectedRows = await dbInstance.transaction(async () => {
            const affectedRows = await dbInstance.update(tEnvironments)
                .set({
                    environmentDeleted: dbInstance.currentZonedDateTime()
                })
                .where(tEnvironments.environmentId.equals(environmentId))
                    .and(tEnvironments.environmentDeleted.isNull())
                .executeUpdate();

            await dbInstance.update(tTeams)
                .set({
                    teamEnvironmentId: null
                })
                .where(tTeams.teamEnvironmentId.equals(environmentId))
                .executeUpdate();

            return affectedRows;
        });

        if (!affectedRows)
            return { success: false, error: 'Unable to remove the environment from the database…' };

        RecordLog({
            type: kLogType.AdminEnvironmentDelete,
            sourceUser: props.user,
            data: {
                environmentId,
                domain: existingEnvironment,
            },
        });

        clearEnvironmentCache();
        clearPageMetadataCache('environment');

        return {
            success: true,
            redirect: '/admin/organisation/structure/environments',
        };
    });
}

/**
 * Server action that either disables or enables the team identified by the given `teamId`.
 */
export async function toggleTeamEnabled(teamId: number, enabled: boolean, formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: 'root',  // only root can disable environments
        });

        const dbInstance = db;
        const existingTeam = await dbInstance.selectFrom(tTeams)
            .where(tTeams.teamId.equals(teamId))
            .select({
                enabled: tTeams.teamDeleted.isNull(),
                title: tTeams.teamTitle,
            })
            .executeSelectNoneOrOne();

        if (!existingTeam)
            return { success: false, error: 'The given team could not be found…' };

        if (existingTeam.enabled === enabled)
            return { success: true, refresh: true };  // status quo is maintained

        const affectedRows = await db.update(tTeams)
            .set({
                teamDeleted: enabled ? null : dbInstance.currentZonedDateTime(),
            })
            .where(tTeams.teamId.equals(teamId))
            .executeUpdate();

        if (!affectedRows)
            return { success: false, error: 'Unable to update the team state in the database…' };

        RecordLog({
            type: kLogType.AdminTeamEnable,
            sourceUser: props.user,
            data: {
                action: enabled ? 'Enabled' : 'Disabled',
                team: existingTeam.title,
            },
        });

        return {
            success: true,
            refresh: true,
        };
    });
}

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
                .and(tEnvironments.environmentDeleted.isNull())
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

    flagManagesContent: z.boolean(),
    flagManagesFaq: z.boolean(),
    flagManagesFirstAid: z.boolean(),
    flagManagesSecurity: z.boolean(),
    flagRequestConfirmation: z.boolean(),
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

                teamFlagManagesContent: !!data.flagManagesContent ? 1 : 0,
                teamFlagManagesFaq: !!data.flagManagesFaq ? 1 : 0,
                teamFlagManagesFirstAid: !!data.flagManagesFirstAid ? 1 : 0,
                teamFlagManagesSecurity: !!data.flagManagesSecurity ? 1 : 0,
                teamFlagRequestConfirmation: !!data.flagRequestConfirmation ? 1 : 0,
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
