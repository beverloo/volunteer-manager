// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { User } from '@lib/auth/User';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@app/lib/database/Types';
import { requireUser } from '@lib/auth/getUser';
import db, { tEvents, tEventsTeams, tRoles, tTeams, tUsersEvents } from '@lib/database';

/**
 * Basic information that will always be made available. Includes the user who is signed in and key
 * information about the event that is being displayed in the administrative area.
 */
export interface PageInfo {
    /**
     * The event that is being shown on this page.
     */
    event: {
        /**
         * Unique ID of the event as it's represented in the database.
         */
        id: number;

        /**
         * Short name of the event, as it should be presented in user interface.
         */
        shortName: string;

        /**
         * Slug of the event, through which it can be identified in the URL.
         */
        slug: string;
    };

    /**
     * The user who is signed in and allowed to view this page.
     */
    user: User;
}

/**
 * Extension on the basic page info that includes information about the team.
 */
export interface PageInfoWithTeam extends PageInfo {
    /**
     * The team that is in context of the page that's being requested.
     */
    team: {
        /**
         * Unique ID of the team as it's represented in the database.
         */
        id: number;

        /**
         * Name of the team as it can be represented in the user interface.
         */
        name: string;

        /**
         * Slug through which this team can be identified in the URL.
         */
        slug: string;
    };
}

type PageInfoParams = { slug: string; };
type PageInfoWithTeamParams = { slug: string; team: string; };

/**
 * Verifies that the current user has access to the current page, and returns information about the
 * user and page appropriate to the amount of information passed in the `params` argument.
 */
export async function verifyAccessAndFetchPageInfo(params: PageInfoWithTeamParams)
    : Promise<PageInfoWithTeam | never>;
export async function verifyAccessAndFetchPageInfo(params: PageInfoParams)
    : Promise<PageInfo | never>;

export async function verifyAccessAndFetchPageInfo(params: { slug: string, team?: string })
    : Promise<(PageInfo | PageInfoWithTeam) | never>
{
    const user = await requireUser();

    // ---------------------------------------------------------------------------------------------
    // Event information
    // ---------------------------------------------------------------------------------------------

    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();
    const rolesJoin = tRoles.forUseInLeftJoin();

    const event = await db.selectFrom(tEvents)
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
            .and(usersEventsJoin.userId.equals(user.userId))
        .leftJoin(rolesJoin)
            .on(rolesJoin.roleId.equals(usersEventsJoin.roleId))
        .where(tEvents.eventSlug.equals(params.slug))
        .select({
            id: tEvents.eventId,
            shortName: tEvents.eventShortName,
            slug: tEvents.eventSlug,

            // For internal use:
            userAdminAccess: rolesJoin.roleAdminAccess,
            userRegistrationStatus: usersEventsJoin.registrationStatus,
            userTeamId: usersEventsJoin.teamId,
        })
        .executeSelectNoneOrOne();

    if (!event)
        notFound();  // no event identified by |params.slug| exists in the database

    if (!event.userAdminAccess || event.userRegistrationStatus !== RegistrationStatus.Accepted) {
        if (!can(user, Privilege.EventAdministrator))
            notFound();  // the |user| does not have access to the event
    }

    if (!Object.hasOwn(params, 'team'))
        return { user, event };

    // ---------------------------------------------------------------------------------------------
    // Team information
    // ---------------------------------------------------------------------------------------------

    const team = await db.selectFrom(tTeams)
        .innerJoin(tEventsTeams)
            .on(tEventsTeams.eventId.equals(event.id))
            .and(tEventsTeams.teamId.equals(tTeams.teamId))
        .where(tTeams.teamEnvironment.equals(params.team!))
        .select({
            id: tTeams.teamId,
            name: tTeams.teamName,
            slug: tTeams.teamEnvironment,
        })
        .executeSelectNoneOrOne();

    if (!team)
        notFound();  // the team does not exist, or does not participate in the |event|

    if (event.userTeamId !== team.id) {
        if (!can(user, Privilege.EventAdministrator))
            notFound();  // the |user| is not part of the |team|
    }

    return { user, event, team };
}
