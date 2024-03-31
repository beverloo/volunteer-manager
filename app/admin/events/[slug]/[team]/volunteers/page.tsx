// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextPageParams } from '@lib/NextRouterParams';
import { type VolunteerInfo, VolunteerTable } from './VolunteerTable';
import { CancelledVolunteers } from './CancelledVolunteers';
import { EventAvailabilityStatus, RegistrationStatus } from '@lib/database/Types';
import { Privilege, can } from '@lib/auth/Privileges';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tEvents, tHotelsAssignments, tHotelsBookings, tHotelsPreferences, tRefunds, tRoles,
    tSchedule, tTrainingsAssignments, tUsersEvents, tUsers } from '@lib/database';

/**
 * The volunteers page for a particular event lists the volunteers who have signed up and have been
 * accepted into the team. Each volunteer has a detailed page that will be linked to as well. Users
 * who have event administrator permission can "import" any volunteer into this event.
 */
export default async function VolunteersPage(props: NextPageParams<'slug' | 'team'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);

    const dbInstance = db;

    const refundsJoin = tRefunds.forUseInLeftJoin();
    const scheduleJoin = tSchedule.forUseInLeftJoin();

    // ---------------------------------------------------------------------------------------------
    // Step (1): Gather a list of all volunteers
    // ---------------------------------------------------------------------------------------------

    const shiftSecondsFragment = dbInstance.fragmentWithType('int', 'optional').sql`
        TIMESTAMPDIFF(SECOND, ${scheduleJoin.scheduleTimeStart}, ${scheduleJoin.scheduleTimeEnd})`;

    const volunteers = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tUsersEvents.eventId))
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .leftJoin(refundsJoin)
            .on(refundsJoin.eventId.equals(tUsersEvents.eventId))
                .and(refundsJoin.userId.equals(tUsersEvents.userId))
        .leftJoin(scheduleJoin)
            .on(scheduleJoin.eventId.equals(event.id))
                .and(scheduleJoin.userId.equals(tUsersEvents.userId))
                .and(scheduleJoin.scheduleDeleted.isNull())
        .groupBy(tUsersEvents.userId)
        .where(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.teamId.equals(team.id))
            .and(tUsersEvents.registrationStatus.in(
                [ RegistrationStatus.Accepted, RegistrationStatus.Cancelled ]))
        .select({
            id: tUsers.userId,
            date: dbInstance.dateTimeAsString(tUsersEvents.registrationDate),
            status: tUsersEvents.registrationStatus,
            name: tUsers.name,
            role: tRoles.roleName,
            roleBadge: tRoles.roleBadge,
            shiftCount: dbInstance.count(scheduleJoin.scheduleId),
            shiftSeconds: dbInstance.sum(shiftSecondsFragment),

            availabilityEligible:
                tEvents.eventAvailabilityStatus.notEquals(EventAvailabilityStatus.Unavailable),
            availabilityConfirmed: tUsersEvents.preferencesUpdated.isNotNull(),
            hotelEligible: tUsersEvents.hotelEligible.valueWhenNull(tRoles.roleHotelEligible),
            refundRequested: refundsJoin.refundRequested.isNotNull(),
            refundConfirmed: refundsJoin.refundConfirmed.isNotNull(),
            trainingEligible: tUsersEvents.trainingEligible.valueWhenNull(
                tRoles.roleTrainingEligible),
        })
        .orderBy(tRoles.roleOrder, 'asc')
        .orderBy('name', 'asc')
        .executeSelectMany();

    const acceptedVolunteers: Map<number, VolunteerInfo> = new Map;
    const cancelledVolunteers: VolunteerInfo[] = [];

    for (const volunteer of volunteers) {
        if (volunteer.status === RegistrationStatus.Accepted)
            acceptedVolunteers.set(volunteer.id, volunteer);
        else
            cancelledVolunteers.push(volunteer);
    }

    // ---------------------------------------------------------------------------------------------
    // Step (2): Complement that list with information about availability
    // ---------------------------------------------------------------------------------------------

    // TODO

    // ---------------------------------------------------------------------------------------------
    // Step (3): Complement that list with information about hotels
    // ---------------------------------------------------------------------------------------------

    const hotelsAssignmentsJoin = tHotelsAssignments.forUseInLeftJoin();
    const hotelsBookingsJoin = tHotelsBookings.forUseInLeftJoin();
    const hotelsPreferencesJoin = tHotelsPreferences.forUseInLeftJoin();

    const hotelInfo = await dbInstance.selectFrom(tUsersEvents)
        .leftJoin(hotelsPreferencesJoin)
            .on(hotelsPreferencesJoin.userId.equals(tUsersEvents.userId))
            .and(hotelsPreferencesJoin.teamId.equals(tUsersEvents.teamId))
            .and(hotelsPreferencesJoin.eventId.equals(tUsersEvents.eventId))
        .leftJoin(hotelsAssignmentsJoin)
            .on(hotelsAssignmentsJoin.eventId.equals(tUsersEvents.eventId))
            .and(hotelsAssignmentsJoin.assignmentUserId.equals(tUsersEvents.userId))
        .leftJoin(hotelsBookingsJoin)
            .on(hotelsBookingsJoin.bookingId.equals(hotelsAssignmentsJoin.bookingId))
            .and(hotelsBookingsJoin.bookingVisible.equals(/* true= */ 1))
        .where(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.teamId.equals(team.id))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .select({
            userId: tUsersEvents.userId,

            hotelPreference: hotelsPreferencesJoin.hotelId,
            hotelPreferencesUpdated: hotelsPreferencesJoin.hotelPreferencesUpdated,
            hotelBookingId: hotelsBookingsJoin.bookingId,
            hotelBookingConfirmed: hotelsBookingsJoin.bookingConfirmed,
        })
        .orderBy('hotelBookingConfirmed', 'asc nulls first')
        .orderBy('hotelBookingId', 'asc nulls first')
        .executeSelectMany();

    for (const volunteerHotelInfo of hotelInfo) {
        const volunteer = acceptedVolunteers.get(volunteerHotelInfo.userId)!;
        if (volunteerHotelInfo.hotelBookingConfirmed) {
            volunteer.hotelStatus = 'confirmed';
        } else if (!!volunteerHotelInfo.hotelPreferencesUpdated) {
            if (!!volunteerHotelInfo.hotelPreference)
                volunteer.hotelStatus = 'submitted';
            else
                volunteer.hotelStatus = 'skipped';
        } else if (volunteer.hotelEligible && event.publishHotels) {
            volunteer.hotelStatus = 'available';
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Step (4): Complement that list with information about trainings
    // ---------------------------------------------------------------------------------------------

    const trainingsAssignmentsJoin = tTrainingsAssignments.forUseInLeftJoin();

    const trainingInfo = await dbInstance.selectFrom(tUsersEvents)
        .leftJoin(trainingsAssignmentsJoin)
            .on(trainingsAssignmentsJoin.eventId.equals(tUsersEvents.eventId))
            .and(trainingsAssignmentsJoin.assignmentUserId.equals(tUsersEvents.userId))
        .where(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.teamId.equals(team.id))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .select({
            userId: tUsersEvents.userId,

            trainingPreference: trainingsAssignmentsJoin.preferenceTrainingId,
            trainingPreferencesUpdated: trainingsAssignmentsJoin.preferenceUpdated,
            trainingAssignment: trainingsAssignmentsJoin.assignmentTrainingId,
            trainingAssignmentConfirmed: trainingsAssignmentsJoin.assignmentConfirmed,
        })
        .executeSelectMany();

    for (const volunteerTrainingInfo of trainingInfo) {
        const volunteer = acceptedVolunteers.get(volunteerTrainingInfo.userId)!;
        if (volunteerTrainingInfo.trainingAssignmentConfirmed) {
            if (!!volunteerTrainingInfo.trainingAssignment)
                volunteer.trainingStatus = 'confirmed';
            else
                volunteer.trainingStatus = 'skipped';
        } else if (!!volunteerTrainingInfo.trainingPreferencesUpdated) {
            volunteer.trainingStatus = 'submitted';
        } else if (volunteer.trainingEligible && event.publishTrainings) {
            volunteer.trainingStatus = 'available';
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Step (5): Actually display the page \o/
    // ---------------------------------------------------------------------------------------------

    const enableExport = can(user, Privilege.VolunteerDataExports);

    return (
        <>
            <VolunteerTable title={`${event.shortName} ${team.name}`} enableExport={enableExport}
                            volunteers={[ ...acceptedVolunteers.values() ]} {...props} />
            { cancelledVolunteers.length > 0 &&
                <CancelledVolunteers volunteers={cancelledVolunteers} /> }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Volunteers');
