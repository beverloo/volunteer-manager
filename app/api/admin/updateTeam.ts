// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { clearEnvironmentCache } from '@lib/Environment';
import db, { tTeams, tTeamsRoles } from '@lib/database';

/**
 * Interface definition for the Volunteer API, exposed through /api/admin/update-team.
 */
export const kUpdateTeamDefinition = z.object({
    request: z.object({
        /**
         * Unique ID of the team that should be updated.
         */
        id: z.number(),

        /**
         * Name of the team.
         */
        teamName: z.string(),

        /**
         * Title of the team's volunteer portal.
         */
        teamTitle: z.string(),

        /**
         * Description of the team. May contain Markdown.
         */
        teamDescription: z.string(),

        /**
         * Theme colour for this team in dark mode.
         */
        teamColourDarkTheme: z.string(),

        /**
         * Theme colour for this team in light mode.
         */
        teamColourLightTheme: z.string(),

        /**
         * The default role that people in this team should be assigned.
         */
        teamDefaultRole: z.number(),

        /**
         * The valid roles that people in this team can be assigned to.
         */
        teamRoles: z.array(z.number()).nonempty(),
    }),
    response: z.strictObject({
        /**
         * Whether the API call was able to execute successfully.
         */
        success: z.boolean(),
    }),
});

export type UpdateTeamDefinition = z.infer<typeof kUpdateTeamDefinition>;

type Request = UpdateTeamDefinition['request'];
type Response = UpdateTeamDefinition['response'];

/**
 * API that allows the details associated with a team to be updated. This includes their name and
 * description, as well as visual information such as the colour scheme that should be used.
 */
export async function updateTeam(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.VolunteerAdministrator))
        noAccess();

    // Verify that the `request` contains at least one role, and a valid default role.
    if (!request.teamRoles.length || !request.teamRoles.includes(request.teamDefaultRole))
        return { success: false };

    const dbInstance = db;
    await dbInstance.transaction(async () => {
        await dbInstance.update(tTeams)
            .set({
                teamName: request.teamName,
                teamTitle: request.teamTitle,
                teamDescription: request.teamDescription,
                teamColourDarkTheme: request.teamColourDarkTheme,
                teamColourLightTheme: request.teamColourLightTheme,
            })
            .where(tTeams.teamId.equals(request.id))
            .executeUpdate(/* min= */ 0, /* max= */ 1);

        await dbInstance.deleteFrom(tTeamsRoles)
            .where(tTeamsRoles.teamId.equals(request.id))
            .executeDelete();

        await dbInstance.insertInto(tTeamsRoles)
            .values(request.teamRoles.map(id => ({
                teamId: request.id,
                roleId: id,
                roleDefault: request.teamDefaultRole === id ? 1 : 0,
            })))
            .executeInsert();
    });

    await Log({
        type: LogType.AdminUpdateTeam,
        severity: LogSeverity.Warning,
        sourceUser: props.user,
        data: {
            team: request.teamName,
        },
    });

    clearEnvironmentCache();

    return { success: true };
}
