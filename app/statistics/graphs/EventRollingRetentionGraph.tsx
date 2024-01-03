// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { DashboardGraph } from '../DashboardGraph';
import { RegistrationStatus } from '@lib/database/Types';
import { computeColor } from '../ColorUtils';
import { dayjs } from '@lib/DateTime';
import db, { tEvents, tUsersEvents } from '@lib/database';

/**
 * Props accepted by the <EventRollingRetentionGraph> component.
 */
export type EventRollingRetentionGraphProps =
    { eventId: number; eventStartTime: string; teamId: number };

/**
 * Graph that displays rolling retention compared to the previous event.
 */
export async function EventRollingRetentionGraph(props: EventRollingRetentionGraphProps) {
    const previousEventId = await db.selectFrom(tEvents)
        .selectOneColumn(tEvents.eventId)
        .where(tEvents.eventStartTime.lessThan(dayjs.utc(props.eventStartTime)))
            .and(tEvents.eventId.notEquals(props.eventId))
        .orderBy(tEvents.eventStartTime, 'desc').limit(1)
        .executeSelectNoneOrOne();

    if (!previousEventId) {
        return <DashboardGraph title="Y/Y retention" presentation="pie" data={[ /* no data */ ]}
                               conclusion="no data" />;
    }

    const usersEventsJoin = tUsersEvents.forUseInLeftJoinAs('curUsersEvent');
    const retention = await db.selectFrom(tUsersEvents)
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.userId.equals(tUsersEvents.userId))
            .and(usersEventsJoin.eventId.equals(props.eventId))
        .where(tUsersEvents.eventId.equals(previousEventId))
            .and(tUsersEvents.teamId.equals(props.teamId))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .select({
            status: usersEventsJoin.registrationStatus,
            teamId: usersEventsJoin.teamId,
        })
        .executeSelectMany();

    let totalCount: number = 0;

    let rejectedCount: number = 0;
    let retainedDifferentTeamCount: number = 0;
    let retainedSameTeamCount: number = 0;
    let unretainedCount: number = 0;

    for (const { status, teamId } of retention) {
        totalCount++;
        if (status === RegistrationStatus.Rejected)
            rejectedCount++;
        else if (!!status && teamId !== props.teamId)
            retainedDifferentTeamCount++;
        else if (!!status && teamId === props.teamId)
            retainedSameTeamCount++;
        else
            unretainedCount++;
    }

    const data = [
        {
            id: 0,
            color: computeColor('success', 1, 2),
            value: retainedSameTeamCount,
            label: 'Retained',
        },
        {
            id: 1,
            color: computeColor('success', 0, 2),
            value: retainedDifferentTeamCount,
            label: 'Different team',
        },
        {
            id: 2,
            color: computeColor('error'),
            value: unretainedCount,
            label: 'Unretained',
        },
        {
            id: 3,
            color: computeColor('warning'),
            value: rejectedCount,
            label: 'Rejected',
        },
    ];

    let conclusion: string | undefined = undefined;
    if (totalCount > 0) {
        const totalRetained = retainedSameTeamCount + retainedDifferentTeamCount + rejectedCount;
        conclusion =
            `${Math.round((totalRetained / totalCount) * 10000) / 100}% of volunteers returned`;
    }

    return <DashboardGraph title="Y/Y retention" presentation="pie" data={data}
                           conclusion={conclusion} />;
}
