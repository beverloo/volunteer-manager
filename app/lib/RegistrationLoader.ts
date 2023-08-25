// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { ApplicationDefinition } from '@app/api/event/application';
import type { Environment } from '@app/Environment';
import type { Event } from './Event';
import { type RegistrationDatabaseRow, Registration } from './Registration';
import { RegistrationStatus, ShirtFit, ShirtSize } from './database/Types';
import db, { sql, tTeams, tTeamsRoles, tUsersEvents } from './database';

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

    const result =
        await sql`
            SELECT
                users_events.registration_date,
                users_events.registration_status,
                roles.role_name,
                events_teams.enable_schedule AS availability_available,
                IF(hotels.hotel_id IS NULL, FALSE, TRUE) AS hotel_available,
                IFNULL(users_events.hotel_eligible, roles.role_hotel_eligible) AS hotel_eligible
            FROM
                users_events
            LEFT JOIN
                teams ON teams.team_id = users_events.team_id AND
                         teams.team_environment = ${environmentName}
            LEFT JOIN
                teams_roles ON teams_roles.role_id = users_events.role_id
            LEFT JOIN
                roles ON roles.role_id = teams_roles.role_id
            LEFT JOIN
                events_teams ON events_teams.event_id = users_events.event_id AND
                                events_teams.team_id = users_events.team_id
            LEFT JOIN
                hotels ON hotels.event_id = users_events.event_id
            WHERE
                users_events.user_id = ${userId} AND
                users_events.event_id = ${event.eventId} AND
                teams.team_id IS NOT NULL
            GROUP BY
                users_events.event_id`;

    if (!result.ok || !result.rows.length)
        return undefined;

    return new Registration(result.rows[0] as RegistrationDatabaseRow);
}

/**
 * Creates a new registration on behalf of the `userId`, based on the given `application` info
 * that they added through the registration portal. Throws an exception when an error occurs.
 */
export async function createRegistration(
    environment: Environment, event: Event, userId: number,
    application: ApplicationData): Promise<void>
{
    const teamDefaultRole = await db.selectFrom(tTeams)
        .innerJoin(tTeamsRoles)
            .on(tTeamsRoles.teamId.equals(tTeams.teamId))
            .and(tTeamsRoles.roleDefault.equals(/* true= */ 1))
        .where(tTeams.teamEnvironment.equals(environment))
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
