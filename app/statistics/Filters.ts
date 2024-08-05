// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';

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
     * Events that the signed in user has access to. `undefined` signals access to all events.
     */
    events?: string[];

    /**
     * Teams that the signed in user has access to. `undefined` signals access to all teams.
     */
    teams?: string[];
}

/**
 * Determines the filters applicable for the signed in user given the `params`. Their upper bound of
 * access is decided first, which is then limited by the `params` to avoid accidental data access.
 */
export async function determineFilters(params: URLSearchParams): Promise<Filters> {
    const { access } = await getAuthenticationContext();

    const events = access.events;
    const teams = access.teams;

    // TODO: Consider `params` in limiting down visibility of the metrics.
    return {
        access: {
            basic: access.can('statistics.basic'),
            finances: access.can('statistics.finances'),
        },
        events: events.includes(kAnyEvent) ? undefined : events,
        teams: teams.includes(kAnyTeam) ? undefined : teams,
    };
}
