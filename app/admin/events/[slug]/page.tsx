// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Grid from '@mui/material/Unstable_Grid2';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { EventIdentityCard } from './EventIdentityCard';
import { EventMetadata } from './EventMetadata';
import { EventRecentChanges } from './EventRecentChanges';
import { EventRecentVolunteers } from './EventRecentVolunteers';
import { EventSeniors } from './EventSeniors';
import { EventTeamCard } from './EventTeamCard';
import { RegistrationStatus } from '@lib/database/Types';
import { generateEventMetadataFn } from './generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tEvents, tEventsTeams, tRoles, tStorage, tTeams, tTrainingsAssignments, tTrainings,
    tUsersEvents, tUsers, tHotels, tHotelsAssignments, tHotelsBookings } from '@lib/database';

/**
 * Returns metadata about the event that's being shown, including hotel & training status and
 * remaining time until the event is about to kick off.
 */
async function getEventMetadata(eventId: number) {
    const dbInstance = db;

    const hotelAssignmentsQuery = dbInstance.selectFrom(tHotelsAssignments)
        .innerJoin(tHotelsBookings)
            .on(tHotelsBookings.bookingId.equals(tHotelsAssignments.bookingId))
        .where(tHotelsAssignments.eventId.equals(eventId))
            .and(tHotelsBookings.bookingVisible.equals(/* true= */ 1))
        .selectCountAll()
        .forUseAsInlineQueryValue();

    const hotelBookingsQuery = dbInstance.selectFrom(tHotelsBookings)
        .where(tHotelsBookings.eventId.equals(eventId))
            .and(tHotelsBookings.bookingVisible.equals(/* true= */ 1))
        .selectCountAll()
        .forUseAsInlineQueryValue();

    const hotelOptionsQuery = dbInstance.selectFrom(tHotels)
        .where(tHotels.eventId.equals(eventId))
            .and(tHotels.hotelRoomVisible.equals(/* true= */ 1))
        .selectCountAll()
        .forUseAsInlineQueryValue();

    const trainingAssignmentsQuery = dbInstance.selectFrom(tTrainingsAssignments)
        .where(tTrainingsAssignments.eventId.equals(eventId))
            .and(tTrainingsAssignments.assignmentTrainingId.isNotNull())
        .selectCountAll()
        .forUseAsInlineQueryValue();

    const trainingSessionsQuery = dbInstance.selectFrom(tTrainings)
        .where(tTrainings.eventId.equals(eventId))
            .and(tTrainings.trainingVisible.equals(/* true= */ 1))
        .selectCountAll()
        .forUseAsInlineQueryValue();

    return await dbInstance.selectFromNoTable()
        .select({
            hotelAssignments: hotelAssignmentsQuery,
            hotelBookings: hotelBookingsQuery,
            hotelOptions: hotelOptionsQuery,
            trainingAssignments: trainingAssignmentsQuery,
            trainingSessions: trainingSessionsQuery,
        })
        .executeSelectNoneOrOne() ?? undefined;
    ;
}

/**
 * Returns the teams that participate in the event, together with some high-level metainformation
 * about whether the teams have published their information pages, registration portal and schedule.
 */
async function getParticipatingTeams(eventId: number) {
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    const dbInstance = db;
    return await dbInstance.selectFrom(tEvents)
        .innerJoin(tEventsTeams)
            .on(tEventsTeams.eventId.equals(tEvents.eventId))
            .and(tEventsTeams.enableTeam.equals(/* true= */ 1))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tEventsTeams.teamId))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
            .and(usersEventsJoin.teamId.equals(tEventsTeams.teamId))
            .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .where(tEvents.eventId.equals(eventId))
        .select({
            teamName: tTeams.teamName,
            teamColourDarkTheme: tTeams.teamColourDarkTheme,
            teamColourLightTheme: tTeams.teamColourLightTheme,
            teamTargetSize: tEventsTeams.teamTargetSize,
            teamSize: dbInstance.count(usersEventsJoin.userId),

            enableContent: tEventsTeams.enableContent.equals(/* true= */ 1),
            enableRegistration: tEventsTeams.enableRegistration.equals(/* true= */ 1),
            enableSchedule: tEventsTeams.enableSchedule.equals(/* true= */ 1),
        })
        .groupBy(tEventsTeams.teamId)
        .orderBy(tTeams.teamName, 'asc')
        .executeSelectMany();
}

/**
 * Returns the most recent changes made by volunteers who are part of the event, for example when
 * they share their preferences. This helps volunteers look out for potential changes.
 */
async function getRecentChanges(eventId: number) {
    // TODO
}

/**
 * Returns the volunteers who most recently signed up to participate in the event.
 */
async function getRecentVolunteers(eventId: number) {
    const storageJoin = tStorage.forUseInLeftJoin();

    return await db.selectFrom(tEvents)
        .innerJoin(tUsersEvents)
            .on(tUsersEvents.eventId.equals(tEvents.eventId))
            .and(tUsersEvents.registrationStatus.notIn([
                RegistrationStatus.Cancelled, RegistrationStatus.Rejected ]))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .leftJoin(storageJoin)
            .on(storageJoin.fileId.equals(tUsers.avatarId))
        .where(tUsersEvents.eventId.equals(eventId))
        .select({
            userId: tUsers.userId,
            avatarHash: storageJoin.fileHash,
            teamEnvironment: tTeams.teamEnvironment,
            name: tUsers.firstName.concat(' ').concat(tUsers.lastName),
            status: tUsersEvents.registrationStatus,
        })
        .orderBy(tUsersEvents.registrationDate, 'desc')
        .orderBy(/* fallback for older events= */ tUsers.username, 'asc')
        .limit(/* based on width of the component= */ 9)
        .executeSelectMany();;
}

/**
 * Returns the Senior-level engineers that participate in the event, which is defined as any role
 * that grants administrator access to the event.
 */
async function getSeniorVolunteers(eventId: number) {
    const rolesJoin = tRoles.forUseInLeftJoin();
    const storageJoin = tStorage.forUseInLeftJoin();

    return await db.selectFrom(tEvents)
        .innerJoin(tUsersEvents)
            .on(tUsersEvents.eventId.equals(tEvents.eventId))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .leftJoin(storageJoin)
            .on(storageJoin.fileId.equals(tUsers.avatarId))
        .leftJoin(rolesJoin)
            .on(rolesJoin.roleId.equals(tUsersEvents.roleId))
        .where(tUsersEvents.eventId.equals(eventId))
            .and(rolesJoin.roleAdminAccess.equals(/* true= */ 1))
        .select({
            userId: tUsers.userId,
            avatarHash: storageJoin.fileHash,
            teamEnvironment: tTeams.teamEnvironment,
            name: tUsers.firstName.concat(' ').concat(tUsers.lastName),
            status: tUsersEvents.registrationStatus,
        })
        .orderBy(rolesJoin.roleOrder, 'asc')
        .orderBy(tUsers.username, 'asc')
        .executeSelectMany();
}

/**
 * The <EventPage> component gathers the required information for the event-specific dashboard,
 * which concisely displays the status and progress of organising an individual event.
 */
export default async function EventPage(props: NextRouterParams<'slug'>) {
    const { event } = await verifyAccessAndFetchPageInfo(props.params);

    const eventMetadata = await getEventMetadata(event.id);
    const participatingTeams = await getParticipatingTeams(event.id);
    const recentChanges = await getRecentChanges(event.id);
    const recentVolunteers = await getRecentVolunteers(event.id);
    const seniorVolunteers = await getSeniorVolunteers(event.id);

    console.log(eventMetadata);

    return (
        <Grid container spacing={2} sx={{ m: '-8px !important' }} alignItems="stretch">
            <Grid xs={3}>
                <EventIdentityCard event={event} />
            </Grid>
            { participatingTeams.map((team, index) =>
                <Grid key={`team-${index}`} xs={3}>
                    <EventTeamCard {...team} />
                </Grid> ) }

            <Grid xs={6}>
                <EventMetadata event={event} metadata={eventMetadata} />
            </Grid>

            <Grid xs={6}>
                <EventRecentChanges />
            </Grid>

            { recentVolunteers.length > 0 &&
                <Grid xs={6}>
                    <EventRecentVolunteers event={event} volunteers={recentVolunteers} />
                </Grid> }

            { seniorVolunteers.length > 0 &&
                <Grid xs={6}>
                    <EventSeniors event={event} volunteers={seniorVolunteers} />
                </Grid> }
        </Grid>
    );
}

export const generateMetadata = generateEventMetadataFn();
