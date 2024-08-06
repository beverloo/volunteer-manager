// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tTeams } from '@lib/database';

import { kAnyEvent, kAnyTeam } from '@lib/auth/AccessList';

/**
 * Filters that should be applied when fetching data for one of the statistics.
 */
export interface Filters {
    /**
     * Whether access should be granted at all, specific to the types of metrics that can be shown
     * on the Volunteer Manager. These map to individual permissions.
     */
    access: {
        basic: boolean;
        finances: boolean;
    },

    /**
     * Event IDs that the signed in user has access to.
     */
    events: number[];

    /**
     * Team IDs that the signed in user has access to.
     */
    teams: number[];
}

/**
 * Determines the filters applicable for the signed in user given the `params`. Their upper bound of
 * access is decided first, which is then limited by the `params` to avoid accidental data access.
 */
export async function determineFilters(params: URLSearchParams): Promise<Filters> {
    const { access } = await getAuthenticationContext();

    // ---------------------------------------------------------------------------------------------

    let requestedEvents: Set<string> | undefined;
    if (params.has('events'))
        requestedEvents = new Set(params.get('events')!.split(','));

    let requestedTeams: Set<string> | undefined;
    if (params.has('teams'))
        requestedTeams = new Set(params.get('teams')!.split(','));

    const filters: Filters = {
        access: {
            basic: access.can('statistics.basic'),
            finances: access.can('statistics.finances'),
        },
        events: [ /* none */ ],
        teams: [ /* none */ ],
    };

    if (!filters.access.basic)
        return filters;

    // ---------------------------------------------------------------------------------------------

    const dbInstance = db;

    const eventsSubQuery = dbInstance.selectFrom(tEvents)
        .select({
            id: tEvents.eventId,
            slug: tEvents.eventSlug,
        })
        .forUseAsInlineAggregatedArrayValue();

    const teamsSubQuery = dbInstance.selectFrom(tTeams)
        .select({
            id: tTeams.teamId,
            slug: tTeams.teamSlug,
        })
        .forUseAsInlineAggregatedArrayValue();

    const { events, teams } = await dbInstance.selectFromNoTable()
        .select({
            events: eventsSubQuery,
            teams: teamsSubQuery,
        })
        .executeSelectOne();

    // ---------------------------------------------------------------------------------------------

    for (const { id, slug } of events) {
        if (!access.can('event.visible', { event: slug, team: kAnyTeam }))
            continue;  // this event is not accessible by the volunteer

        if (requestedEvents && !requestedEvents.has(slug))
            continue;  // this event has not been selected

        filters.events.push(id);
    }

    for (const { id, slug } of teams) {
        if (!access.can('event.visible', { event: kAnyEvent, team: slug }))
            continue;  // this team is not accessible by the volunteer

        if (requestedTeams && !requestedTeams.has(slug))
            continue;  // this team has not been selected

        filters.teams.push(id);
    }

    return filters;
}
