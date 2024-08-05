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
     * Event IDs that the signed in user has access to. `undefined` signals access to all events.
     */
    events?: number[];

    /**
     * Team IDs that the signed in user has access to. `undefined` signals access to all teams.
     */
    teams?: number[];
}

/**
 * Determines the filters applicable for the signed in user given the `params`. Their upper bound of
 * access is decided first, which is then limited by the `params` to avoid accidental data access.
 */
export async function determineFilters(params: URLSearchParams): Promise<Filters> {
    const { access } = await getAuthenticationContext();

    // TODO: Consider `params` in limiting down visibility of the metrics.
    // TODO: Include `event.visible` access for the metrics.

    let events: number[] | undefined;
    if (!access.events.length) {
        events = [ /* no events */ ];
    } else if (!access.events.includes(kAnyEvent)) {
        events = await db.selectFrom(tEvents)
            .where(tEvents.eventSlug.in(access.events))
            .selectOneColumn(tEvents.eventId)
            .executeSelectMany();
    }

    let teams: number[] | undefined;
    if (!access.teams.length) {
        teams = [ /* no teams */ ];
    } else if (!access.teams.includes(kAnyTeam)) {
        teams = await db.selectFrom(tTeams)
            .where(tTeams.teamSlug.in(access.teams))
            .selectOneColumn(tTeams.teamId)
            .executeSelectMany();
    }

    return {
        access: {
            basic: access.can('statistics.basic'),
            finances: access.can('statistics.finances'),
        },
        events,
        teams,
    };
}
