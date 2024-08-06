// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Filters } from '../Filters';
import type { LineGraphData } from '../components/LineGraph';
import { RegistrationStatus } from '@lib/database/Types';
import { toLineGraphData } from './toLineGraphData';
import db, { tEvents, tTeams, tUsers, tUsersEvents } from '@lib/database';

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
 * Query that gathers the gender distribution for each of the events and teams included in the
 * given `filters`. The Male, Female and Other genders are separated out - further details are
 * captured in the system when shared by the volunteer, but not currently displayed in this graph.
 */
export async function getGenderDistribution(filters: Filters): Promise<LineGraphData> {
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();
    const usersJoin = tUsers.forUseInLeftJoin();

    const data = await db.selectFrom(tEvents)
        .innerJoin(tTeams)
            .on(tTeams.teamId.inIfValue(filters.teams))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
                .and(usersEventsJoin.teamId.equals(tTeams.teamId))
                .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .leftJoin(usersJoin)
            .on(usersJoin.userId.equals(usersEventsJoin.userId))
        .where(tEvents.eventId.inIfValue(filters.events))
        .select({
            event: {
                slug: tEvents.eventSlug,
            },
            gender: usersJoin.gender,
            volunteers: db.countDistinct(usersEventsJoin.userId),
        })
        .groupBy(tEvents.eventId, usersJoin.gender)
        .orderBy(tEvents.eventStartTime)
        .executeSelectMany();

    type EventMetrics = { male: number; female: number; other: number; };

    const totalVolunteersPerEvent = new Map<string, EventMetrics>();
    const eventArray: string[] = [ /* empty */ ];

    for (const { event, gender, volunteers } of data) {
        if (!totalVolunteersPerEvent.has(event.slug)) {
            totalVolunteersPerEvent.set(event.slug, {
                male: 0,
                female: 0,
                other: 0,
            });

            eventArray.push(event.slug);
        }

        let field: keyof EventMetrics;
        switch (gender) {
            case 'Male':
            case 'male':
                field = 'male';
                break;

            case 'Female':
            case 'female':
                field = 'female';
                break;

            default:
                field = 'other';
                break;
        }

        totalVolunteersPerEvent.get(event.slug)![field] += volunteers;
    }

    return toLineGraphData(eventArray.map(slug => {
        const { male, female, other } = totalVolunteersPerEvent.get(slug)!;
        const total = male + female + other;

        return [
            {
                event: { slug },
                series: {
                    id: 'female',
                    color: '#E91E63',
                    label: 'Female',
                },
                value: safePercentage(female, total),
            },
            {
                event: { slug },
                series: {
                    id: 'male',
                    color: '#3F51B5',
                    label: 'Male',
                },
                value: safePercentage(male, total),
            },
            {
                event: { slug },
                series: {
                    id: 'other',
                    color: '#8BC34A',
                    label: 'Other',
                },
                value: safePercentage(other, total),
            }
        ];
    }).flat());
}
