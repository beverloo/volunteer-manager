// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Filters } from '../Filters';
import type { LineGraphData } from '../components/LineGraph';
import { RegistrationStatus } from '@lib/database/Types';
import { toLineGraphData } from './toLineGraphData';
import db, { tEvents, tTeams, tUsersEvents } from '@lib/database';

/**
 * Query that gathers the fraction of cancelled applications for each of the events, filtered down
 * based on the given `filters`.
 */
export async function getCancelledApplications(filters: Filters): Promise<LineGraphData> {
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    const data = await db.selectFrom(tEvents)
        .innerJoin(tTeams)
            .on(tTeams.teamId.inIfValue(filters.teams))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
                .and(usersEventsJoin.teamId.equals(tTeams.teamId))
                .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Cancelled))
        .where(tEvents.eventId.inIfValue(filters.events))
        .select({
            event: {
                slug: tEvents.eventSlug,
            },
            series: {
                id: tTeams.teamSlug,
                color: tTeams.teamColourLightTheme,
                label: tTeams.teamName,
            },
            value: db.count(usersEventsJoin.userId),
        })
        .groupBy(tEvents.eventId, tTeams.teamId)
        .orderBy(tEvents.eventStartTime)
        .executeSelectMany();

    return toLineGraphData(data);
}
