// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { DashboardGraph } from '../DashboardGraph';
import { RegistrationStatus } from '@lib/database/Types';
import { getIndexedColor } from '../ColorUtils';
import db, { tRoles, tUsersEvents } from '@lib/database';

/**
 * Graph that displays the role distribution for a given event, identified by its `eventId`.
 */
export async function EventRoleDistributionGraph(props: { eventId: number; teamId: number }) {
    const distribution = await db.selectFrom(tUsersEvents)
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .where(tUsersEvents.eventId.equals(props.eventId))
            .and(tUsersEvents.teamId.equals(props.teamId))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .select({
            label: tRoles.roleName,
            value: db.count(tUsersEvents.userId),
            adminAccess: tRoles.roleAdminAccess,
        })
        .groupBy(tUsersEvents.roleId)
        .orderBy(tRoles.roleOrder, 'asc')
        .executeSelectMany();

    let juniorCount: number = 0;
    let seniorCount: number = 0;

    for (const { adminAccess, value } of distribution) {
        if (adminAccess)
            seniorCount += value;
        else
            juniorCount += value;
    }

    const data = distribution.map(({ label, value }, index) => ({
        label, value,
        color: getIndexedColor(index),
        id: index,
    }));

    const totalCount = juniorCount + seniorCount;

    let conclusion: string | undefined = undefined;
    if (totalCount > 0) {
        conclusion =
            `${Math.round((seniorCount / totalCount) * 10000) / 100}% of the team are Senior+`;
    }

    return <DashboardGraph title="Role distribution" presentation="pie" data={data}
                           conclusion={conclusion} />;
}
