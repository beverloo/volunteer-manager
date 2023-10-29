// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { DashboardGraph } from '../DashboardGraph';
import { RegistrationStatus } from '@lib/database/Types';
import { computeColor } from '../ColorUtils';
import db, { tUsersEvents } from '@lib/database';

/**
 * Graph that displays retention status of this event, i.e. rejected and cancelled volunteers.
 */
export async function EventStatusRetentionGraph(props: { eventId: number; teamId: number }) {
    const applications = await db.selectFrom(tUsersEvents)
        .where(tUsersEvents.eventId.equals(props.eventId))
            .and(tUsersEvents.teamId.equals(props.teamId))
        .selectOneColumn(tUsersEvents.registrationStatus)
        .executeSelectMany();

    let totalCount: number = 0;

    let acceptedCount: number = 0;
    let cancelledCount: number = 0;
    let rejectedCount: number = 0;
    let pendingCount: number = 0;

    for (const applicationStatus of applications) {
        totalCount++;

        switch (applicationStatus) {
            case RegistrationStatus.Accepted:
                acceptedCount++;
                break;

            case RegistrationStatus.Cancelled:
                cancelledCount++;
                break;

            case RegistrationStatus.Registered:
                pendingCount++;
                break;

            case RegistrationStatus.Rejected:
                rejectedCount++;
                break;

            default:
                throw new Error(`Unrecognised registration status: ${applicationStatus}`);
        }
    }

    const data = [
        {
            id: 0,
            color: computeColor('success'),
            value: acceptedCount,
            label: 'Accepted',
        },
        {
            id: 1,
            color: computeColor('error', 0, 2),
            value: cancelledCount,
            label: 'Cancelled',
        },
        {
            id: 2,
            color: computeColor('error', 1, 2),
            value: rejectedCount,
            label: 'Rejected',
        },
        {
            id: 3,
            color: computeColor('warning'),
            value: pendingCount,
            label: 'Unanswered',
        }
    ];

    let conclusion: string | undefined = undefined;
    if (totalCount > 0) {
        conclusion =
            `${Math.round((acceptedCount / totalCount) * 10000) / 100}% of applicants participated`;
    }

    return <DashboardGraph title="Inbound applications" presentation="pie" data={data}
                           conclusion={conclusion} />;
}
