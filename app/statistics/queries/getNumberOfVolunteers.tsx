// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Filters } from '../Filters';
import type { LineGraphData } from '../components/LineGraph';
import { RegistrationStatus } from '@lib/database/Types';
import db, { tEvents, tTeams, tUsersEvents } from '@lib/database';

/**
 * Result from a database query that should be converted to a `LineGraphData` type.
 */
type DatabaseResult = {
    event: {
        slug: string;
    };
    team: {
        color: string;
        label: string;
        slug: string;
    };
    value: number;
};

/**
 * Converts the given `input` to a structure that is compatible with the `LineGraphData` type. The
 * events included in the `input` are expected to be included in ascending order.
 */
function toLineGraphData(input: DatabaseResult[]): LineGraphData {
    const dataset = new Map<string, Record<string, string | number | null>>();
    const series = new Map<string, LineGraphData['series'][number]>();

    const xAxis = new Map<string, NonNullable<LineGraphData['xAxis']>[number]>();
    const xAxisKeys: string[] = [ /* empty */ ];

    for (const entry of input) {
        if (!dataset.has(entry.event.slug)) {
            dataset.set(entry.event.slug, {
                event: entry.event.slug,
            });
        }

        dataset.get(entry.event.slug)![entry.team.slug] = entry.value || null;

        if (!series.has(entry.team.slug)) {
            series.set(entry.team.slug, {
                dataKey: entry.team.slug,

                color: entry.team.color,
                label: entry.team.label,
            });
        }

        if (!xAxis.has(entry.event.slug)) {
            xAxisKeys.push(entry.event.slug);
            xAxis.set(entry.event.slug, {
                id: entry.event.slug,
                dataKey: 'event',
                scaleType: 'band',
            });
        }
    }

    return {
        dataset: [ ...dataset.values() ],
        series: [ ...series.values() ],
        xAxis: xAxisKeys.map(key => xAxis.get(key)!),
    };
}

/**
 * Query that gathers the number of volunteers for each of the years and teams included in the
 * `filters`. The data is intended to be displayed in a line graph.
 */
export async function getNumberOfVolunteers(filters: Filters): Promise<LineGraphData> {
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    const data = await db.selectFrom(tEvents)
        .innerJoin(tTeams)
            .on(tTeams.teamId.inIfValue(filters.teams))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
                .and(usersEventsJoin.teamId.equals(tTeams.teamId))
                .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .where(tEvents.eventId.inIfValue(filters.events))
        .select({
            event: {
                slug: tEvents.eventSlug,
            },
            team: {
                color: tTeams.teamColourLightTheme,
                label: tTeams.teamName,
                slug: tTeams.teamSlug,
            },
            value: db.count(usersEventsJoin.userId),
        })
        .groupBy(tEvents.eventId, tTeams.teamId)
        .orderBy(tEvents.eventStartTime)
        .executeSelectMany();

    return toLineGraphData(data);
}
