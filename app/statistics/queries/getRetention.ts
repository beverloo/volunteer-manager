// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Filters } from '../Filters';
import type { LineGraphData } from '../components/LineGraph';
import { RegistrationStatus } from '@lib/database/Types';
import { toLineGraphData } from './toLineGraphData';
import db, { tEvents, tTeams, tUsersEvents } from '@lib/database';

/**
 * Query that gathers the percentage of the team that was retained from previous events. Retention
 * is one of our key metrics as unhappy volunteers are rather unlikely to help out again.
 *
 * We consider a volunteer to be "retained" when they have helped out in one of the two events prior
 * to the one being displayed. This allows them to skip one for personal reasons, which happens
 * quite a lot and would just add noise to the KPI.
 */
export async function getRetention(filters: Filters): Promise<LineGraphData> {
    const dbInstance = db;

    const firstPriorEvent = tEvents.as('fpe');
    const secondPriorEvent = tEvents.as('spe');

    const priorUserEventsJoin = tUsersEvents.forUseInLeftJoinAs('puej');
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    // Select the Event ID of the event immediately prior to the one being considered:
    const selectFirstPriorEvent = dbInstance.subSelectUsing(tEvents)
        .from(firstPriorEvent)
        .where(firstPriorEvent.eventStartTime.lessThan(tEvents.eventStartTime))
        .selectOneColumn(firstPriorEvent.eventId)
        .orderBy(firstPriorEvent.eventStartTime, 'desc')
        .limit(1)
        .forUseAsInlineQueryValue();

    // Select the Event ID of the event that happened two instances ago:
    const selectSecondPriorEvent = dbInstance.subSelectUsing(tEvents)
        .from(secondPriorEvent)
        .where(secondPriorEvent.eventStartTime.lessThan(tEvents.eventStartTime))
        .selectOneColumn(secondPriorEvent.eventId)
        .orderBy(secondPriorEvent.eventStartTime, 'desc')
        .limit(1).offset(1)
        .forUseAsInlineQueryValue();

    const data = await db.selectFrom(tEvents)
        .innerJoin(tTeams)
            .on(tTeams.teamId.inIfValue(filters.teams))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
                .and(usersEventsJoin.teamId.equals(tTeams.teamId))
                .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .leftJoin(priorUserEventsJoin)
            .on(priorUserEventsJoin.eventId.equals(selectFirstPriorEvent).or(
                priorUserEventsJoin.eventId.equals(selectSecondPriorEvent)))
                .and(priorUserEventsJoin.userId.equals(usersEventsJoin.userId))
                .and(priorUserEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
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
            previousEvent: priorUserEventsJoin.eventId,
            volunteers: dbInstance.aggregateAsArrayOfOneColumn(usersEventsJoin.userId),
        })
        .groupBy(tEvents.eventId, tTeams.teamId, priorUserEventsJoin.eventId)
        .orderBy(tEvents.eventStartTime)
        .executeSelectMany();

    type EventMetrics = Map<string, {
        volunteers: Set<number>;
        retained: Set<number>;
    }>;

    type SeriesInfo = {
        id: string;
        color: string;
        label: string;
    };

    const events = new Map<string, EventMetrics>();
    const eventArray: string[] = [ /* empty */ ];
    const series = new Map<string, SeriesInfo>();

    for (const entry of data) {
        if (!events.has(entry.event.slug)) {
            events.set(entry.event.slug, new Map);
            eventArray.push(entry.event.slug);
        }

        if (!series.has(entry.series.id))
            series.set(entry.series.id, entry.series);

        const event = events.get(entry.event.slug)!;
        if (!event.has(entry.series.id)) {
            event.set(entry.series.id, {
                volunteers: new Set(),
                retained: new Set(),
            });
        }

        const team = event.get(entry.series.id)!;
        for (const volunteer of entry.volunteers) {
            if (!!entry.previousEvent)
                team.retained.add(volunteer);

            team.volunteers.add(volunteer);
        }
    }

    return toLineGraphData(eventArray.map(slug => {
        const event = events.get(slug)!;
        return [ ...event.entries() ].map(([ team, { volunteers, retained } ]) => {
            return {
                event: { slug },
                series: series.get(team)!,
                value: (!volunteers.size || !retained.size) ? 0
                                                            : retained.size / volunteers.size,
            };
        });

    }).flat());
}
