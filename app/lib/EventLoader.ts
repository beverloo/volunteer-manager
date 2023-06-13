// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Event, type EventDatabaseRow, type EventTeamsDatabaseRow } from './Event';
import { Privilege } from './auth/Privileges';
import { User } from './auth/User';
import { sql } from './database';

/**
 * Returns a single event identified by the given |id|, or undefined when it does not exist. This
 * function issues, at most, two database queries.
 */
export async function getEventById(id: number) {
    return getEventInternal(id, /* slug= */ null);
}

/**
 * Returns a single event identified by the given |slug|, or undefined when it does not exist. This
 * function issues, at most, two database queries.
 */
export async function getEventBySlug(slug: string) {
    return getEventInternal(/* id= */ null, slug);
}

/**
 * Returns all events regardless of visibility. This function issues, at most, two database queries.
 */
export async function getEvents(): Promise<Event[]> {
    const eventResults = await sql`SELECT * FROM events ORDER BY event_start_time ASC`;
    if (!eventResults.ok || !eventResults.rows.length)
        return [ /* no events */ ];

    const teamResults =
        await sql`
            SELECT
                *
            FROM
                events_teams
            LEFT JOIN
                teams ON teams.team_id = events_teams.team_id`;

    if (!teamResults.ok || !teamResults.rows.length)
        return [ /* no teams */ ];

    return combineEventsAndTeams(
        eventResults.rows as EventDatabaseRow[], teamResults.rows as EventTeamsDatabaseRow[]);
}

/**
 * Returns all events that are publicly visible, limited to the |user| when they are signed in to
 * their account. This function issues, at most, two database queries.
 */
export async function getEventsForUser(user?: User): Promise<Event[]> {
    const showPastEvents = user && user.can(Privilege.ShowPastEvents);
    const showFutureEvents = user && user.can(Privilege.ShowFutureEvents);

    const eventResults =
        await sql`
            SELECT
                *
            FROM
                events
            WHERE
                events.event_hidden IS FALSE AND
                (
                    (events.event_end_time < NOW() AND ${showPastEvents}) OR
                    (events.event_start_time > NOW() AND ${showFutureEvents}) OR
                    EXISTS (
                        SELECT
                            1
                        FROM
                            events_teams
                        WHERE
                            events_teams.event_id = events.event_id AND
                            events_teams.enable_content = 1
                    )
                )
            ORDER BY
                event_start_time ASC`;

    if (!eventResults.ok || !eventResults.rows.length)
        return [ /* no events */ ];

    const eventResultRows = eventResults.rows as EventDatabaseRow[];
    const eventIds = eventResultRows.map(eventRow => eventRow.event_id);

    const teamResults =
        await sql`
            SELECT
                *
            FROM
                events_teams
            LEFT JOIN
                teams ON teams.team_id = events_teams.team_id
            WHERE
                events_teams.event_id IN (${eventIds})`;

    if (!teamResults.ok || !teamResults.rows.length)
        return [ /* no teams */ ];

    return combineEventsAndTeams(eventResultRows, teamResults.rows as EventTeamsDatabaseRow[]);
}

/**
 * Returns a single event identified by either its unique numeric ID, or by the URL-safe slug.
 */
async function getEventInternal(id: number, slug: null): Promise<Event | undefined>;
async function getEventInternal(id: null, slug: string): Promise<Event | undefined>;
async function getEventInternal(id: number | null, slug: string | null): Promise<Event | undefined>{
    const eventResult = id !== null ? await sql`SELECT * FROM events WHERE event_id=${id}`
                                    : await sql`SELECT * FROM events WHERE event_slug=${slug}`;

    if (!eventResult.ok || !eventResult.rows.length)
        return undefined;

    const eventDatabaseRow = eventResult.rows[0] as EventDatabaseRow;
    const teamResults =
        await sql`
            SELECT
                *
            FROM
                events_teams
            LEFT JOIN
                teams ON teams.team_id = events_teams.team_id
            WHERE
                event_id = ${eventDatabaseRow.event_id}`;

    if (!teamResults.ok || !teamResults.rows.length)
        return undefined;

    return new Event(eventDatabaseRow, teamResults.rows as EventTeamsDatabaseRow[]);
}

/**
 * Utility function that combines the given |events| with the given |teams| based on their shared
 * event ID, as that information is obtained through separate database queries.
 */
function combineEventsAndTeams(eventRows: EventDatabaseRow[], teamRows: EventTeamsDatabaseRow[]) {
    const teamsByEventId: { [eventId: number]: EventTeamsDatabaseRow[] } = {};
    for (const eventTeamDatabaseRow of teamRows) {
        if (!Object.hasOwn(teamsByEventId, eventTeamDatabaseRow.event_id))
            teamsByEventId[eventTeamDatabaseRow.event_id] = [];

        teamsByEventId[eventTeamDatabaseRow.event_id].push(eventTeamDatabaseRow);
    }

    const events: Event[] = [];
    for (const eventDatabaseRow of eventRows) {
        if (!Object.hasOwn(teamsByEventId, eventDatabaseRow.event_id))
            continue;

        events.push(new Event(eventDatabaseRow, teamsByEventId[eventDatabaseRow.event_id]));
    }

    return events;
}
