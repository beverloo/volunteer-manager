// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { ApplicationDefinition } from '@app/api/event/application';
import type { Event } from './Event';
import { Registration } from './Registration';
import { RegistrationStatus, ShirtFit, ShirtSize } from './database/Types';
import db, { tEvents, tHotels, tRoles, tTeams, tTeamsRoles, tUsersEvents } from './database';

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

    const dbInstance = db;
    const registration = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tUsersEvents.eventId))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
            .and(tTeams.teamEnvironment.equals(environmentName))
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .where(tUsersEvents.userId.equals(userId))
            .and(tUsersEvents.eventId.equals(event.eventId))
        .select({
            role: tRoles.roleName,
            status: tUsersEvents.registrationStatus,

            availabilityAvailable: tEvents.publishAvailability.equals(/* true= */ 1),
            availabilityEligible: dbInstance.true(),
            // TODO: `availability`

            hotelAvailable: tEvents.publishHotels.equals(/* true= */ 1),
            hotelEligible: tRoles.roleHotelEligible.equals(/* true= */ 1),
            // TODO: `hotel`

            trainingAvailable: tEvents.publishTrainings.equals(/* true= */ 1),
            trainingEligible: tRoles.roleTrainingEligible.equals(/* true= */ 1),
            // TODO: `training`
        })
        .groupBy(tUsersEvents.eventId)
        .executeSelectNoneOrOne();

    if (!registration)
        return undefined;

    return new Registration(registration);
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
            registrationDate: dbInstance.currentDateTime(),
            registrationStatus: RegistrationStatus.Registered,
            shirtFit: application.tshirtFit as ShirtFit,
            shirtSize: application.tshirtSize as ShirtSize,
            preferenceHours: parseInt(application.serviceHours, 10),
            preferenceTimingStart, preferenceTimingEnd,
            preferences: application.preferences,
            fullyAvailable: !!application.availability ? 1 : 0,
            includeCredits: !!application.credits ? 1 : 0,
            includeSocials: !!application.socials ? 1 : 0,
        })
        .executeInsert(/* min= */ 0, /* max= */ 1);

    if (!affectedRows)
        throw new Error('Unable to create an application for the chosen team');
}
