// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { DashboardGraph } from '../DashboardGraph';
import { RegistrationStatus } from '@lib/database/Types';
import { dayjs } from '@lib/DateTime';
import db, { tEvents, tUsersEvents } from '@lib/database';

/**
 * Props accepted by the <EventInboundRetentionGraph> component.
 */
export type EventInboundRetentionGraphProps =
    { eventId: number; eventStartTime: string; teamId: number };

/**
 * Graph that displays inbound retention considering the volunteers participating in this event.
 */
export async function EventInboundRetentionGraph(props: EventInboundRetentionGraphProps) {
    const eventsJoin = tEvents.forUseInLeftJoinAs('prevEvents');
    const usersEventsJoin = tUsersEvents.forUseInLeftJoinAs('prevUsersEvents');

    const dbInstance = db;
    const retention = await dbInstance.selectFrom(tUsersEvents)
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.userId.equals(tUsersEvents.userId))
            .and(usersEventsJoin.eventId.notEquals(tUsersEvents.eventId))
        .leftJoin(eventsJoin)
            .on(eventsJoin.eventId.equals(usersEventsJoin.eventId))
        .where(tUsersEvents.eventId.equals(props.eventId))
            .and(tUsersEvents.teamId.equals(props.teamId))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .select({
            participation: dbInstance.aggregateAsArray({
                eventStartTime: eventsJoin.eventStartTime,
                teamId: usersEventsJoin.teamId,
            }),
        })
        .groupBy(tUsersEvents.userId)
        .executeSelectMany();

    let totalCount: number = 0;

    let recruitedCount: number = 0;
    let retainedDifferentTeam: number = 0;
    let retained1YCount: number = 0;
    let retained3YCount: number = 0;
    let retainedEverCount: number = 0;

    const graphEventStartTime = dayjs(props.eventStartTime);
    for (const { participation } of retention) {
        totalCount++;

        let latestEventStartTime: dayjs.Dayjs | undefined = undefined;
        let latestTeamId: number | undefined = undefined;

        for (const { eventStartTime, teamId } of participation) {
            const currentEventStartTime = dayjs(eventStartTime);
            if (currentEventStartTime.isAfter(graphEventStartTime))
                continue;  // ignore events that happen in the future

            if (!latestEventStartTime || currentEventStartTime.isAfter(latestEventStartTime)) {
                latestEventStartTime = currentEventStartTime;
                latestTeamId = teamId;
            }
        }

        if (!latestEventStartTime) {
            recruitedCount++;
            continue;
        }

        const diffInMonths = graphEventStartTime.diff(latestEventStartTime, 'months');

        if (latestTeamId !== props.teamId)
            retainedDifferentTeam++;
        else if (diffInMonths <= 18)
            retained1YCount++;
        else if (diffInMonths <= 36)
            retained3YCount++;
        else
            retainedEverCount++;
    }

    const data = [
        {
            id: 0,
            value: recruitedCount,
            label: 'New recruits',
        },
        {
            id: 1,
            value: retainedDifferentTeam,
            label: 'Different team',
        },
        {
            id: 2,
            value: retained1YCount,
            label: 'Retained (Y/Y)',
        },
        {
            id: 3,
            value: retained3YCount,
            label: 'Retained (<= 3Y)',
        },
        {
            id: 4,
            value: retainedEverCount,
            label: 'Retained (> 3Y)',
        }
    ];

    let conclusion: string | undefined = undefined;
    if (totalCount > 0) {
        conclusion =
            `${Math.round((recruitedCount / totalCount) * 10000) / 100}% of volunteers are new ` +
            'recruits';
    }

    return <DashboardGraph title="Inbound retention" presentation="pie" data={data}
                           conclusion={conclusion} />;
}
