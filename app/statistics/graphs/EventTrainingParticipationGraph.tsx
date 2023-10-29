// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { DashboardGraph } from '../DashboardGraph';
import { RegistrationStatus } from '@lib/database/Types';
import db, { tRoles, tTrainingsAssignments, tUsersEvents } from '@lib/database';

/**
 * Graph that displays volunteer participation in the training sessions for a particular event.
 */
export async function EventTrainingParticipationGraph(props: { eventId: number; teamId: number }) {
    const trainingsAssignmentsJoin = tTrainingsAssignments.forUseInLeftJoin();

    const distribution = await db.selectFrom(tUsersEvents)
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .leftJoin(trainingsAssignmentsJoin)
            .on(trainingsAssignmentsJoin.eventId.equals(tUsersEvents.eventId))
            .and(trainingsAssignmentsJoin.assignmentUserId.equals(tUsersEvents.userId))
        .where(tUsersEvents.eventId.equals(props.eventId))
            .and(tUsersEvents.teamId.equals(props.teamId))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .select({
            eligible: tUsersEvents.trainingEligible.valueWhenNull(tRoles.roleTrainingEligible),
            participated: trainingsAssignmentsJoin.assignmentTrainingId.isNotNull(),
        })
        .executeSelectMany();

    let totalCount: number = 0;
    let notEligibleCount: number = 0;
    let eligibleCount: number = 0;
    let participatedCount: number = 0;

    for (const { eligible, participated } of distribution) {
        totalCount++;

        if (participated)
            participatedCount++;
        else if (eligible)
            eligibleCount++;
        else
            notEligibleCount++;
    }

    const data = [
        {
            id: 0,
            label: 'Not eligible',
            value: notEligibleCount,
        },
        {
            id: 1,
            label: 'Skipped',
            value: eligibleCount,
        },
        {
            id: 2,
            label: 'Participated',
            value: participatedCount,
        }
    ];

    let conclusion: string | undefined = undefined;
    if (totalCount > 0) {
        conclusion =
            `${Math.round((participatedCount / totalCount) * 10000) / 100}% participated in ` +
            'the training';
    }

    return <DashboardGraph title="Training participation" presentation="pie" data={data}
                           conclusion={conclusion} />;
}
