// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Environment } from '../Environment';
import { type EventDatabaseRow, Event } from './Event';
import { Privilege } from './auth/Privileges';
import { User } from './auth/User';

import { getRequestEnvironment } from './getRequestEnvironment';
import { sql } from './database';

/**
 * Returns a single event identified by the given |id|, or undefined when it does not exist. This
 * function issues a database query specific to the current environment.
 */
export async function getEventById(id: number) {
    return getEventInternal(id, /* slug= */ null);
}

/**
 * Returns a single event identified by the given |slug|, or undefined when it does not exist. This
 * function issues a database query specific to the current environment.
 */
export async function getEventBySlug(slug: string) {
    return getEventInternal(/* id= */ null, slug);
}

/**
 * Returns a single event identified by either its unique numeric ID, or by the URL-safe slug.
 */
async function getEventInternal(id: number, slug: null): Promise<Event | undefined>;
async function getEventInternal(id: null, slug: string): Promise<Event | undefined>;
async function getEventInternal(id: number | null, slug: string | null): Promise<Event | undefined>{
    // TODO: Implement this function.
    return undefined;
}

/**
 * Returns all events that are publicly visible, limited to the |user| when they are signed in to
 * their account. This function issues a database query specific to the current environment.
 */
export async function getEventsForUser(user?: User, environment?: Environment): Promise<Event[]> {
    const eventResults = await sql`
        SELECT
            events.event_id,
            events.event_name,
            events.event_short_name,
            events.event_slug,
            events.event_start_time,
            events.event_end_time,
            events_teams.enable_content,
            events_teams.enable_registration,
            events_teams.enable_schedule
        FROM
            events
        LEFT JOIN
            events_teams ON events_teams.event_id = events.event_id
        LEFT JOIN
            teams ON teams.team_id = events_teams.team_id
        WHERE
            events.event_hidden = 0 AND
            teams.team_environment = ${environment ?? getRequestEnvironment()}
        ORDER BY
            event_start_time DESC`;

    if (!eventResults.ok)
        return [ /* no events */ ];

    const eventContentOverride = user && user.can(Privilege.EventContentOverride);
    const eventRegistrationOverride = user && user.can(Privilege.EventRegistrationOverride);
    const eventScheduleOverride = user && user.can(Privilege.EventScheduleOverride);

    const events: Event[] = [];
    for (const untypedEventDatabaseRow of eventResults.rows) {
        const eventDatabaseRow = untypedEventDatabaseRow as EventDatabaseRow;
        if ((eventDatabaseRow.enable_content || eventContentOverride) ||
                (eventDatabaseRow.enable_registration || eventRegistrationOverride) ||
                (eventDatabaseRow.enable_schedule || eventScheduleOverride)) {
            events.push(new Event(eventDatabaseRow));
        }
    }

    return events;
}
