// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { AccessControl } from '@lib/auth/AccessControl';
import type { User } from '@lib/auth/User';
import { Privilege } from '@lib/auth/Privileges';
import { RegistrationStatus, type EventAvailabilityStatus } from '@lib/database/Types';
import { requireAuthenticationContext, type PermissionAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tEventsTeams, tRoles, tStorage, tTeams, tUsersEvents } from '@lib/database';

/**
 * Basic information that will always be made available. Includes the user who is signed in and key
 * information about the event that is being displayed in the administrative area.
 */
export interface PageInfo {
    /**
     * Access control object defining what the signed in user is able to do.
     */
    access: AccessControl;

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
        hotelInformationPublished: boolean;

        /**
         * Whether information about refunds should be published to volunteers.
         */
        refundInformationPublished: boolean;

        /**
         * Whether information about the trainings has been published to volunteers.
         */
        trainingInformationPublished: boolean;

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
         * Timezone in which the event will be taking place.
         */
        timezone: string;

        /**
         * Time at which the first shifts of the event will commence. In UTC in a format compatible
         * with Temporal ZonedDateTime.
         */
        startTime: string;

        /**
         * Time at which the final shifts of the event will finish. In UTC in a format compatible
         * with Temporal ZonedDateTime.
         */
        endTime: string;

        /**
         * Date and time starting which volunteers can request refunds, if any. When given, it will
         * be in UTC in a format compatible with Temporal ZonedDateTime.
         */
        refundsStartTime?: string;

        /**
         * Date and time until which volunteers can request refunds, if any. When given, it will
         * be in UTC in a format compatible with Temporal ZonedDateTime.
         */
        refundsEndTime?: string;

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

        /**
         * Whether hotel room management is enabled for this event.
         */
        hotelEnabled: boolean;

        /**
         * Whether refund management is enabled for this event.
         */
        refundEnabled: boolean;

        /**
         * Whether training management is enabled for this event.
         */
        trainingEnabled: boolean;
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
         * Colour assigned to the team, to be used in the user interface.
         */
        colour: string;

        /**
         * Whether this team is responsible for managing the frequently asked questions.
         */
        managesFaq: boolean;

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
         * Plural word to use when talking about a member of this team.
         */
        plural: string;

        /**
         * Unique slug through which this team can be identified in the URL.
         */
        slug: string;

        /**
         * Environment of the frontend that this team is serviced by.
         */
        _environment: string;
    };
}

type PageInfoParams = { event: string; };
type PageInfoWithTeamParams = { event: string; team: string; };

/**
 * Verifies that the current user has access to the current page, and returns information about the
 * user and page appropriate to the amount of information passed in the `params` argument. The
 * page can optionally be guarded behind a given `privilege` as well.
 */
export async function verifyAccessAndFetchPageInfo(
    params: PageInfoWithTeamParams, accessCheck?: PermissionAccessCheck | Privilege)
        : Promise<PageInfoWithTeam | never>;
export async function verifyAccessAndFetchPageInfo(
    params: PageInfoParams, accessCheck?: PermissionAccessCheck | Privilege)
        : Promise<PageInfo | never>;
export async function verifyAccessAndFetchPageInfo(
    params: { event: string, team?: string }, accessCheck?: PermissionAccessCheck | Privilege)
        : Promise<(PageInfo | PageInfoWithTeam) | never>
{
    const permission = typeof accessCheck === 'object' ? accessCheck : undefined;
    const privilege = typeof accessCheck === 'number' ? accessCheck : undefined;

    const { access, user } = await requireAuthenticationContext({
        check: 'admin-event',
        event: params.event,
        permission,
        privilege,
    });

    // ---------------------------------------------------------------------------------------------
    // Event information
    // ---------------------------------------------------------------------------------------------

    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();
    const rolesJoin = tRoles.forUseInLeftJoin();
    const storageJoin = tStorage.forUseInLeftJoin();

    const dbInstance = db;
    const event = await dbInstance.selectFrom(tEvents)
        .leftJoin(storageJoin)
            .on(storageJoin.fileId.equals(tEvents.eventIdentityId))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
            .and(usersEventsJoin.userId.equals(user.userId))
            .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .leftJoin(rolesJoin)
            .on(rolesJoin.roleId.equals(usersEventsJoin.roleId))
        .where(tEvents.eventSlug.equals(params.event))
        .select({
            id: tEvents.eventId,
            hidden: tEvents.eventHidden.equals(/* true= */ 1),
            name: tEvents.eventName,
            shortName: tEvents.eventShortName,
            identityHash: storageJoin.fileHash,
            slug: tEvents.eventSlug,
            timezone: tEvents.eventTimezone,
            startTime: dbInstance.dateTimeAsString(tEvents.eventStartTime),
            endTime: dbInstance.dateTimeAsString(tEvents.eventEndTime),
            refundRequestsStart: dbInstance.dateTimeAsString(tEvents.refundRequestsStart),
            refundRequestsEnd: dbInstance.dateTimeAsString(tEvents.refundRequestsEnd),
            availabilityStatus: tEvents.eventAvailabilityStatus,
            location: tEvents.eventLocation,
            festivalId: tEvents.eventFestivalId,
            hotelRoomForm: tEvents.eventHotelRoomForm,
            hotelInformationPublished: tEvents.hotelInformationPublished.equals(/* true= */ 1),
            refundInformationPublished: tEvents.refundInformationPublished.equals(/* true= */ 1),
            trainingInformationPublished:
                tEvents.trainingInformationPublished.equals(/* true= */ 1),

            // Management system availability:
            hotelEnabled: tEvents.hotelEnabled.equals(/* true= */ 1),
            refundEnabled: tEvents.refundEnabled.equals(/* true= */ 1),
            trainingEnabled: tEvents.trainingEnabled.equals(/* true= */ 1),

            // For internal use:
            userTeamId: usersEventsJoin.teamId,
        })
        .executeSelectNoneOrOne();

    if (!event)
        notFound();  // no event identified by |params.slug| exists in the database

    if (!Object.hasOwn(params, 'team'))
        return { access, user, event };

    // ---------------------------------------------------------------------------------------------
    // Team information
    // ---------------------------------------------------------------------------------------------

    const team = await db.selectFrom(tTeams)
        .innerJoin(tEventsTeams)
            .on(tEventsTeams.eventId.equals(event.id))
            .and(tEventsTeams.teamId.equals(tTeams.teamId))
            .and(tEventsTeams.enableTeam.equals(/* true= */ 1))
        .where(tTeams.teamSlug.equals(params.team!))
        .select({
            id: tTeams.teamId,
            colour: tTeams.teamColourLightTheme,
            name: tTeams.teamName,
            plural: tTeams.teamPlural,
            slug: tTeams.teamSlug,
            _environment: tTeams.teamEnvironment,
            managesFaq: tTeams.teamManagesFaq.equals(/* true= */ 1),
            managesFirstAid: tTeams.teamManagesFirstAid.equals(/* true= */ 1),
            managesSecurity: tTeams.teamManagesSecurity.equals(/* true= */ 1),
        })
        .executeSelectNoneOrOne();

    if (!team)
        notFound();  // the team does not exist, or does not participate in the |event|

    return { access, user, event, team };
}
