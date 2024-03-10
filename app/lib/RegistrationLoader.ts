// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { ApplicationDefinition } from '@app/api/event/application';
import type { Event } from './Event';
import { Registration } from './Registration';
import { RegistrationStatus, ShirtFit, ShirtSize } from './database/Types';
import db, { tEvents, tEventsTeams, tHotels, tHotelsAssignments, tHotelsBookings,
    tHotelsPreferences, tRefunds, tRoles, tTeams, tTeamsRoles, tTrainings, tTrainingsAssignments,
    tUsers, tUsersEvents } from './database';

type ApplicationData = Omit<ApplicationDefinition['request'], 'event'>;

/**
 * Retrieves the registration associated with the given `userId` at the given `event`. When no such
 * registration exists, `undefined` will be returned instead.
 */
export async function getRegistration(environmentName: string, event: Event, userId?: number)
    : Promise<Registration | undefined>
{
    if (!userId)
        return undefined;

    const hotelsJoin = tHotels.forUseInLeftJoin();
    const hotelsPreferencesJoin = tHotelsPreferences.forUseInLeftJoin();
    const refundsJoin = tRefunds.forUseInLeftJoin();
    const trainingsAssignedJoin = tTrainings.forUseInLeftJoinAs('t1');
    const trainingsPreferenceJoin = tTrainings.forUseInLeftJoinAs('t2');
    const trainingsAssignmentsJoin = tTrainingsAssignments.forUseInLeftJoin();

    const dbInstance = db;
    const registration = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tUsersEvents.eventId))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
            .and(tTeams.teamEnvironment.equals(environmentName))
        .innerJoin(tEventsTeams)
            .on(tEventsTeams.eventId.equals(tUsersEvents.eventId))
            .and(tEventsTeams.teamId.equals(tUsersEvents.teamId))
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .leftJoin(hotelsPreferencesJoin)
            .on(hotelsPreferencesJoin.userId.equals(tUsersEvents.userId))
                .and(hotelsPreferencesJoin.eventId.equals(tUsersEvents.eventId))
                .and(hotelsPreferencesJoin.teamId.equals(tUsersEvents.teamId))
        .leftJoin(hotelsJoin)
            .on(hotelsJoin.hotelId.equals(hotelsPreferencesJoin.hotelId))
        .leftJoin(refundsJoin)
            .on(refundsJoin.userId.equals(tUsersEvents.userId))
                .and(refundsJoin.eventId.equals(tUsersEvents.eventId))
        .leftJoin(trainingsAssignmentsJoin)
            .on(trainingsAssignmentsJoin.assignmentUserId.equals(tUsersEvents.userId))
            .and(trainingsAssignmentsJoin.eventId.equals(tUsersEvents.eventId))
        .leftJoin(trainingsPreferenceJoin)
            .on(trainingsPreferenceJoin.trainingId.equals(
                trainingsAssignmentsJoin.preferenceTrainingId))
        .leftJoin(trainingsAssignedJoin)
            .on(trainingsAssignedJoin.trainingId.equals(
                trainingsAssignmentsJoin.assignmentTrainingId))
        .where(tUsersEvents.userId.equals(userId))
            .and(tUsersEvents.eventId.equals(event.eventId))
        .select({
            role: tRoles.roleName,
            teamId: tTeams.teamId,
            status: tUsersEvents.registrationStatus,

            availabilityStatus: tEvents.eventAvailabilityStatus,
            availabilityEventLimit: tUsersEvents.availabilityEventLimit.valueWhenNull(
                tRoles.roleAvailabilityEventLimit),
            availability: {
                preferences: tUsersEvents.preferences,
                timeslots: tUsersEvents.availabilityTimeslots,
                serviceHours: tUsersEvents.preferenceHours,
                serviceTimingStart: tUsersEvents.preferenceTimingStart,
                serviceTimingEnd: tUsersEvents.preferenceTimingEnd,
            },

            hotelAvailable: tEvents.publishHotels.equals(/* true= */ 1),
            hotelEligible: tUsersEvents.hotelEligible.valueWhenNull(
                tRoles.roleHotelEligible).equals(/* true= */ 1),
            hotelPreferences: {
                hotelId: hotelsPreferencesJoin.hotelId,
                hotelName: hotelsJoin.hotelName,
                hotelRoom: hotelsJoin.hotelRoomName,
                checkIn: dbInstance.dateAsString(hotelsPreferencesJoin.hotelDateCheckIn),
                checkOut: dbInstance.dateAsString(hotelsPreferencesJoin.hotelDateCheckOut),
                sharingPeople: hotelsPreferencesJoin.hotelSharingPeople,
                sharingPreferences: hotelsPreferencesJoin.hotelSharingPreferences,
                updated: hotelsPreferencesJoin.hotelPreferencesUpdatedString,
            },

            refund: {
                ticketNumber: refundsJoin.refundTicketNumber,
                accountIban: refundsJoin.refundAccountIban,
                accountName: refundsJoin.refundAccountName,
                requested: refundsJoin.refundRequestedString,
                confirmed: refundsJoin.refundConfirmedString,
            },

            trainingAvailable: tEvents.publishTrainings.equals(/* true= */ 1),
            trainingEligible: tUsersEvents.trainingEligible.valueWhenNull(
                tRoles.roleTrainingEligible).equals(/* true= */ 1),
            training: {
                confirmed: trainingsAssignmentsJoin.assignmentConfirmed.equals(/* true= */ 1),
                preference: trainingsAssignmentsJoin.preferenceTrainingId,
                updated: trainingsAssignmentsJoin.preferenceUpdatedString,

                preferenceDate: trainingsPreferenceJoin.trainingStartString,
                assignedDate: trainingsAssignedJoin.trainingStartString,
                assignedEndDate: trainingsAssignedJoin.trainingEndString,
                assignedAddress: trainingsAssignedJoin.trainingAddress,
            },
        })
        .groupBy(tUsersEvents.eventId)
        .executeSelectNoneOrOne();

    const hotelsAssignmentsJoin = tHotelsAssignments.forUseInLeftJoinAs('a2');
    const usersJoin = tUsers.forUseInLeftJoin();

    const hotelBookings = await dbInstance.selectFrom(tHotelsAssignments)
        .innerJoin(tHotelsBookings)
            .on(tHotelsBookings.bookingId.equals(tHotelsAssignments.bookingId))
            .and(tHotelsBookings.bookingVisible.equals(/* true= */ 1))
        .innerJoin(tHotels)
            .on(tHotels.hotelId.equals(tHotelsBookings.bookingHotelId))
        .leftJoin(hotelsAssignmentsJoin)
            .on(hotelsAssignmentsJoin.bookingId.equals(tHotelsAssignments.bookingId))
            .and(hotelsAssignmentsJoin.assignmentUserId.notEquals(userId))
        .leftJoin(usersJoin)
            .on(usersJoin.userId.equals(hotelsAssignmentsJoin.assignmentUserId))
        .where(tHotelsAssignments.assignmentUserId.equals(userId))
            .and(tHotelsAssignments.eventId.equals(event.eventId))
            .and(tHotelsBookings.bookingConfirmed.equals(/* true= */ 1))
        .select({
            checkIn: dbInstance.dateAsString(tHotelsBookings.bookingCheckIn),
            checkOut: dbInstance.dateAsString(tHotelsBookings.bookingCheckOut),

            hotel: {
                name: tHotels.hotelName,
                room: tHotels.hotelRoomName,
            },

            sharing: dbInstance.aggregateAsArrayOfOneColumn(
                hotelsAssignmentsJoin.assignmentName.valueWhenNull(usersJoin.name)),
        })
        .groupBy(tHotelsAssignments.bookingId)
        .orderBy('checkIn', 'asc')
        .executeSelectMany();

    if (!registration)
        return undefined;

    return new Registration(registration, hotelBookings);
}

/**
 * Creates a new registration on behalf of the `userId`, based on the given `application` info
 * that they added through the registration portal. Throws an exception when an error occurs.
 */
export async function createRegistration(
    environmentName: string, event: Event, userId: number,
    application: ApplicationData): Promise<void>
{
    const teamDefaultRole = await db.selectFrom(tTeams)
        .innerJoin(tTeamsRoles)
            .on(tTeamsRoles.teamId.equals(tTeams.teamId))
            .and(tTeamsRoles.roleDefault.equals(/* true= */ 1))
        .where(tTeams.teamEnvironment.equals(environmentName))
        .select({
            teamId: tTeams.teamId,
            roleId: tTeamsRoles.roleId,
        })
        .executeSelectNoneOrOne();

    if (!teamDefaultRole)
        throw new Error('Unable to determine which team the application is for.');

    const [ preferenceTimingStart, preferenceTimingEnd ] =
        application.serviceTiming.split('-').map(v => parseInt(v, 10));

    const dbInstance = db;
    const affectedRows = await dbInstance.insertInto(tUsersEvents)
        .set({
            userId: userId,
            eventId: event.eventId,
            teamId: teamDefaultRole.teamId,
            roleId: teamDefaultRole.roleId,
            registrationDate: dbInstance.currentZonedDateTime(),
            registrationStatus: RegistrationStatus.Registered,
            shirtFit: application.tshirtFit as ShirtFit,
            shirtSize: application.tshirtSize as ShirtSize,
            preferenceHours: parseInt(application.serviceHours, 10),
            preferenceTimingStart, preferenceTimingEnd,
            preferences: application.preferences,
            preferencesUpdated: dbInstance.currentZonedDateTime(),
            fullyAvailable: !!application.availability ? 1 : 0,
            includeCredits: !!application.credits ? 1 : 0,
            includeSocials: !!application.socials ? 1 : 0,
        })
        .executeInsert();

    if (!affectedRows)
        throw new Error('Unable to create an application for the chosen team');
}
