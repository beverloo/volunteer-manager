// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Filters } from '../Filters';
import type { LineGraphData } from '../components/LineGraph';
import { RegistrationStatus } from '@lib/database/Types';
import { toLineGraphData } from './toLineGraphData';
import db, { tEvents, tTeams, tUsersEvents } from '@lib/database';

/**
 * Computes the percentage (0-100) that the `share` represents of the `total`. Safely deals with
 * zero values for either argument.
 */
function safePercentage(share: number, total: number): number {
    if (share === 0 || total === 0)
        return 0;

    return (share / total) * 100;
}

/**
 * Query that gathers the acceptance, rejection and cancellation rates of received applications in
 * a particular event, filtered according to the given `filters`.
 */
export async function getApplicationStatus(filters: Filters): Promise<LineGraphData> {
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    const data = await db.selectFrom(tEvents)
        .innerJoin(tTeams)
            .on(tTeams.teamId.inIfValue(filters.teams))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
                .and(usersEventsJoin.teamId.equals(tTeams.teamId))
        .where(tEvents.eventId.inIfValue(filters.events))
        .select({
            event: {
                slug: tEvents.eventSlug,
            },
            status: usersEventsJoin.registrationStatus,
            volunteers: db.count(usersEventsJoin.userId),
        })
        .groupBy(tEvents.eventId, usersEventsJoin.registrationStatus)
        .orderBy(tEvents.eventStartTime)
        .executeSelectMany();

    type EventMetrics = {
        [RegistrationStatus.Accepted]: number;
        [RegistrationStatus.Cancelled]: number;
        [RegistrationStatus.Registered]: number;
        [RegistrationStatus.Rejected]: number;
    };

    const events = new Map<string, EventMetrics>();
    const eventArray: string[] = [ /* empty */ ];

    for (const { event, status, volunteers } of data) {
        if (!events.has(event.slug)) {
            events.set(event.slug, {
                [RegistrationStatus.Accepted]: 0,
                [RegistrationStatus.Cancelled]: 0,
                [RegistrationStatus.Registered]: 0,
                [RegistrationStatus.Rejected]: 0,
            });

            eventArray.push(event.slug);
        }

        events.get(event.slug)![status!] += volunteers;
    }

    return toLineGraphData(eventArray.map(slug => {
        const statuses = events.get(slug)!;
        const total =
            statuses[RegistrationStatus.Accepted] + statuses[RegistrationStatus.Cancelled] +
            statuses[RegistrationStatus.Registered] + statuses[RegistrationStatus.Rejected];

        return [
            {
                event: { slug },
                series: {
                    id: RegistrationStatus.Accepted,
                    color: '#8BC34A',
                    label: RegistrationStatus.Accepted,
                },
                value: safePercentage(statuses[RegistrationStatus.Accepted], total),
            },
            {
                event: { slug },
                series: {
                    id: RegistrationStatus.Cancelled,
                    color: '#FF7043',
                    label: RegistrationStatus.Cancelled,
                },
                value: safePercentage(statuses[RegistrationStatus.Cancelled], total),
            },
            {
                event: { slug },
                series: {
                    id: RegistrationStatus.Registered,
                    color: '#BDBDBD',
                    label: RegistrationStatus.Registered,
                },
                value: safePercentage(statuses[RegistrationStatus.Registered], total),
            },
            {
                event: { slug },
                series: {
                    id: RegistrationStatus.Rejected,
                    color: '#8D6E63',
                    label: RegistrationStatus.Rejected,
                },
                value: safePercentage(statuses[RegistrationStatus.Rejected], total),
            },
        ];

    }).flat());
}
