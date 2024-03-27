// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import db, { tEvents, tEventsTeams, tTeams } from '@lib/database';

/**
 * Context that is to be validated by this utility.
 */
type Context = { event: string; team: string; };

/**
 * Validates that the given `context` is correct, and returns an object containing both the event
 * and team information loaded from the database.
 */
export async function validateContext(context: Context) {
    const result = await db.selectFrom(tEvents)
        .innerJoin(tTeams)
            .on(tTeams.teamEnvironment.equals(context.team))
        .innerJoin(tEventsTeams)
            .on(tEventsTeams.teamId.equals(tTeams.teamId))
                .and(tEventsTeams.enableTeam.equals(/* true= */ 1))
        .where(tEvents.eventSlug.equals(context.event))
        .select({
            event: {
                id: tEvents.eventId,
                festivalId: tEvents.eventFestivalId,
                name: tEvents.eventShortName,
            },
            team: {
                id: tTeams.teamId,
                name: tTeams.teamName,
            },
        })
        .groupBy(tEvents.eventId)
        .executeSelectNoneOrOne();

    return result ?? { event: undefined, team: undefined };
}
