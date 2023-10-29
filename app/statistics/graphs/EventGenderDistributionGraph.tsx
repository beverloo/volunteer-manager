// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { DashboardGraph } from '../DashboardGraph';
import { RegistrationStatus } from '@lib/database/Types';
import db, { tUsersEvents, tUsers } from '@lib/database';

/**
 * Graph that displays the gender distribution for a given event, identified by its `eventId`.
 */
export async function EventGenderDistributionGraph(props: { eventId: number; teamId: number }) {
    const distribution = await db.selectFrom(tUsersEvents)
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .where(tUsersEvents.eventId.equals(props.eventId))
            .and(tUsersEvents.teamId.equals(props.teamId))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
            .and(tUsers.gender.isNotNull())
        .select({
            label: tUsers.gender,
            value: db.count(tUsers.userId),
        })
        .groupBy(tUsers.gender)
        .orderBy(tUsers.gender, 'asc')
        .executeSelectMany();

    let maleCount: number = 0;
    let totalCount: number = 0;

    for (const { label, value } of distribution) {
        totalCount += value;
        if (label === 'Male')
            maleCount += value;
    }

    const data = distribution.map(({ label, value }, index) => ({
        label, value,
        id: index,
    }));

    let conclusion: string | undefined = undefined;
    if (totalCount > 0)
        conclusion = `${Math.round((maleCount / totalCount) * 10000) / 100}% of the team are males`;

    return <DashboardGraph title="Gender distribution" presentation="pie" data={data}
                           conclusion={conclusion} />;
}
