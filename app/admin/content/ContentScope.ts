// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Represents the scope of the content that should be accessible. Instances can be obtained through
 * the `create{Event,Global}Scope()` method exported by `//app/admin/content/ContentScope.ts`.
 */
export interface ContentScope {
    /**
     * Unique ID of the event content will be scoped to.
     */
    eventId: number;

    /**
     * Unique ID of the team content will be scoped to.
     */
    teamId: number;
}

/**
 * Creates an event-based content scope, which is keyed by the event's ID, as well as the team's ID.
 */
export function createEventScope(eventId: number, teamId: number): ContentScope {
    return { eventId, teamId };
}

/**
 * Creates a global content scope.
 */
export function createGlobalScope(): ContentScope {
    return {
        eventId: /* none= */ 0,
        teamId: /* stewards= */ 2,
    };
}
