// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type ApplicationDefinition } from '@app/api/event/application';
import { type Event } from './Event';
import { type RegistrationDatabaseRow, Registration } from './Registration';
import { type User } from './auth/User';
import { Environment } from '@app/Environment';
import { sql } from './database';

type ApplicationData = Omit<ApplicationDefinition['request'], 'event'>;

/**
 * Retrieves the registration associated with the given `user` at the given `event`. When no such
 * registration exists, `undefined` will be returned instead.
 */
export async function getRegistration(environment: Environment, event: Event, user?: User)
    : Promise<Registration | undefined>
{
    if (!user)
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
                         teams.team_environment = ${environment}
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
                users_events.user_id = ${user.userId} AND
                users_events.event_id = ${event.eventId} AND
                teams.team_id IS NOT NULL
            GROUP BY
                users_events.event_id`;

    if (!result.ok || !result.rows.length)
        return undefined;

    return new Registration(result.rows[0] as RegistrationDatabaseRow);
}

/**
 * Creates a new registration on behalf of the `user`, based on the given `application` information
 * that they added through the registration portal. Throws an exception when an error occurs.
 */
export async function createRegistration(
    environment: Environment, event: Event, user: User, application: ApplicationData): Promise<void>
{
    const teamResult =
        await sql`
            SELECT
                teams.team_id AS teamId,
                teams_roles.role_id AS roleId
            FROM
                teams
            LEFT JOIN
                teams_roles ON teams_roles.team_id = teams.team_id AND
                               teams_roles.role_default = 1
            WHERE
                teams.team_environment = ${environment}`;

    if (!teamResult.ok || !teamResult.rows.length)
        throw new Error('Unable to determine which team the application is for.');

    const { teamId, roleId } = teamResult.rows[0];

    const serviceHours = parseInt(application.serviceHours, 10);
    const [ serviceTimingStart, serviceTimingEnd ] =
        application.serviceTiming.split('-').map(v => parseInt(v, 10));

    const createResult =
        await sql`
            INSERT INTO
                users_events
                (user_id, event_id, team_id, role_id, registration_date, registration_status,
                 shirt_fit, shirt_size, preference_hours, preference_timing_start,
                 preference_timing_end, preferences, fully_available, include_credits,
                 include_socials)
            VALUES
                (${user.userId}, ${event.eventId}, ${teamId}, ${roleId}, NOW(), "Registered",
                 ${application.tshirtFit}, ${application.tshirtSize}, ${serviceHours},
                 ${serviceTimingStart}, ${serviceTimingEnd}, ${application.preferences},
                 ${application.availability}, ${application.credits}, ${application.socials})`;

    if (!createResult.ok) {
        throw new Error('Unable to create an application for the chosen team.', {
            cause: createResult.error
        });
    }
}
