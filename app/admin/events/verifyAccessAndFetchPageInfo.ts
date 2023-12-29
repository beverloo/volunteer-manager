// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { EventAvailabilityStatus } from '@lib/database/Types';
import type { User } from '@lib/auth/User';
import { Privilege } from '@lib/auth/Privileges';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tEventsTeams, tRoles, tStorage, tTeams, tUsersEvents } from '@lib/database';

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
         * Whether the event is hidden from the public, and all existing admin access should be
         * revoked from senior+ level volunteers.
         */
        hidden: boolean;

        /**
         * Whether information about the trainings has been published to volunteers.
         */
        publishHotels: boolean;

        /**
         * Whether information about refunds should be published to volunteers.
         */
        publishRefunds: boolean;

        /**
         * Whether information about the trainings has been published to volunteers.
         */
        publishTrainings: boolean;

        /**
         * Short name of the event, as it should be presented in user interface.
         */
        shortName: string;

        /**
         * Full name of the event, including its theme.
         */
        name: string;

        /**
         * Hash of the file containing the event's identity image, if any.
         */
        identityHash?: string;

        /**
         * Slug of the event, through which it can be identified in the URL.
         */
        slug: string;

        /**
         * Time at which the first shifts of the event will commence.
         */
        startTime: Date;

        /**
         * Time at which the final shifts of the event will finish.
         */
        endTime: Date;

        /**
         * Date and time starting which volunteers can request refunds, if any.
         */
        refundsStartTime?: Date;

        /**
         * Date and time until which volunteers can request refunds, if any.
         */
        refundsEndTime?: Date;

        /**
         * Status of the event's program publication and the ability for volunteers to indicate
         * their preferences.
         */
        availabilityStatus: EventAvailabilityStatus;

        /**
         * Unique Id of this festival as indicated in AnPlan.
         */
        festivalId?: number;

        /**
         * Link to the hotel room form where bookings should be made.
         */
        hotelRoomForm?: string;
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
         * Whether this team is responsible for managing the first aid team.
         */
        managesFirstAid: boolean;

        /**
         * Whether this team is responsible for managing the security team.
         */
        managesSecurity: boolean;

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
 * user and page appropriate to the amount of information passed in the `params` argument. The
 * page can optionally be guarded behind a given `privilege` as well.
 */
export async function verifyAccessAndFetchPageInfo(
    params: PageInfoWithTeamParams, privilege?: Privilege): Promise<PageInfoWithTeam | never>;
export async function verifyAccessAndFetchPageInfo(
    params: PageInfoParams, privilege?: Privilege): Promise<PageInfo | never>;

export async function verifyAccessAndFetchPageInfo(
    params: { slug: string, team?: string }, privilege?: Privilege)
        : Promise<(PageInfo | PageInfoWithTeam) | never>
{
    const { user } = await requireAuthenticationContext({
        check: 'admin-event',
        event: params.slug,
        privilege
    });

    // ---------------------------------------------------------------------------------------------
    // Event information
    // ---------------------------------------------------------------------------------------------

    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();
    const rolesJoin = tRoles.forUseInLeftJoin();
    const storageJoin = tStorage.forUseInLeftJoin();

    const event = await db.selectFrom(tEvents)
        .leftJoin(storageJoin)
            .on(storageJoin.fileId.equals(tEvents.eventIdentityId))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
            .and(usersEventsJoin.userId.equals(user.userId))
        .leftJoin(rolesJoin)
            .on(rolesJoin.roleId.equals(usersEventsJoin.roleId))
        .where(tEvents.eventSlug.equals(params.slug))
        .select({
            id: tEvents.eventId,
            hidden: tEvents.eventHidden.equals(/* true= */ 1),
            name: tEvents.eventName,
            shortName: tEvents.eventShortName,
            identityHash: storageJoin.fileHash,
            slug: tEvents.eventSlug,
            startTime: tEvents.eventStartTime,
            endTime: tEvents.eventEndTime,
            refundsStartTime: tEvents.eventRefundsStartTime,
            refundsEndTime: tEvents.eventRefundsEndTime,
            availabilityStatus: tEvents.eventAvailabilityStatus,
            location: tEvents.eventLocation,
            festivalId: tEvents.eventFestivalId,
            hotelRoomForm: tEvents.eventHotelRoomForm,
            publishHotels: tEvents.publishHotels.equals(/* true= */ 1),
            publishRefunds: tEvents.publishRefunds.equals(/* true= */ 1),
            publishTrainings: tEvents.publishTrainings.equals(/* true= */ 1),

            // For internal use:
            userTeamId: usersEventsJoin.teamId,
        })
        .executeSelectNoneOrOne();

    if (!event)
        notFound();  // no event identified by |params.slug| exists in the database

    if (!Object.hasOwn(params, 'team'))
        return { user, event };

    // ---------------------------------------------------------------------------------------------
    // Team information
    // ---------------------------------------------------------------------------------------------

    const team = await db.selectFrom(tTeams)
        .innerJoin(tEventsTeams)
            .on(tEventsTeams.eventId.equals(event.id))
            .and(tEventsTeams.teamId.equals(tTeams.teamId))
            .and(tEventsTeams.enableTeam.equals(/* true= */ 1))
        .where(tTeams.teamEnvironment.equals(params.team!))
        .select({
            id: tTeams.teamId,
            name: tTeams.teamName,
            slug: tTeams.teamEnvironment,
            managesFirstAid: tTeams.teamManagesFirstAid.equals(/* true= */ 1),
            managesSecurity: tTeams.teamManagesSecurity.equals(/* true= */ 1),
        })
        .executeSelectNoneOrOne();

    if (!team)
        notFound();  // the team does not exist, or does not participate in the |event|

    return { user, event, team };
}
