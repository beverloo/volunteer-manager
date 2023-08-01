// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Event } from './Event';
import { type RegistrationDatabaseRow, Registration } from './Registration';
import { type User } from './auth/User';
import { Environment } from '@app/Environment';
import { sql } from './database';

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
                roles.role_name
            FROM
                users_events
            LEFT JOIN
                teams ON teams.team_id = users_events.team_id AND
                         teams.team_environment = ${environment}
            LEFT JOIN
                teams_roles ON teams_roles.role_id = users_events.role_id
            LEFT JOIN
                roles ON roles.role_id = teams_roles.role_id
            WHERE
                users_events.user_id = ${user.userId} AND
                users_events.event_id = ${event.eventId} AND
                teams.team_id IS NOT NULL`;

    if (!result.ok || !result.rows.length)
        return undefined;

    return new Registration(result.rows[0] as RegistrationDatabaseRow);
}
