// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import Collapse from '@mui/material/Collapse';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { TrainingAssignments, type TrainingAssignment } from './TrainingAssignments';
import { TrainingConfiguration } from './TrainingConfiguration';
import { TrainingExternal } from './TrainingExternal';
import { TrainingOverview, type TrainingConfirmation } from './TrainingOverview';
import { dayjs } from '@lib/DateTime';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

import db, { tRoles, tTeams, tTrainings, tTrainingsAssignments, tTrainingsExtra, tUsersEvents,
    tUsers } from '@lib/database';

export default async function EventTrainingPage(props: NextRouterParams<'slug'>) {
    const { event, user } = await verifyAccessAndFetchPageInfo(props.params);

    // Training management is more restricted than the general event administration.
    if (!can(user, Privilege.EventTrainingManagement))
        notFound();

    const trainingsAssignmentsJoin = tTrainingsAssignments.forUseInLeftJoin();

    const assignments = await db.selectFrom(tUsersEvents)
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .leftJoin(trainingsAssignmentsJoin)
            .on(trainingsAssignmentsJoin.eventId.equals(tUsersEvents.eventId))
            .and(trainingsAssignmentsJoin.assignmentUserId.equals(tUsersEvents.userId))
        .where(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
            .and(
                tUsersEvents.trainingEligible.equals(/* true= */ 1).or(
                    tRoles.roleTrainingEligible.equals(/* true= */ 1)))
        .select({
            userId: tUsersEvents.userId,

            name: tUsers.firstName.concat(' ').concat(tUsers.lastName),
            team: tTeams.teamEnvironment,

            preferenceTrainingId: trainingsAssignmentsJoin.preferenceTrainingId,
            preferenceUpdated: trainingsAssignmentsJoin.preferenceUpdated,

            assignedTrainingId: trainingsAssignmentsJoin.assignmentTrainingId,
            assignedUpdated: trainingsAssignmentsJoin.assignmentUpdated,

            confirmed: trainingsAssignmentsJoin.assignmentConfirmed,
        })
        .orderBy('name', 'asc')
        .executeSelectMany();

    const extraParticipants = await db.selectFrom(tTrainingsExtra)
        .leftJoin(trainingsAssignmentsJoin)
            .on(trainingsAssignmentsJoin.eventId.equals(tTrainingsExtra.eventId))
            .and(trainingsAssignmentsJoin.assignmentExtraId.equals(tTrainingsExtra.trainingExtraId))
        .where(tTrainingsExtra.eventId.equals(event.id))
            .and(tTrainingsExtra.trainingExtraVisible.equals(/* true= */ 1))
        .select({
            id: tTrainingsExtra.trainingExtraId,

            trainingExtraName: tTrainingsExtra.trainingExtraName,
            trainingExtraEmail: tTrainingsExtra.trainingExtraEmail,
            trainingExtraBirthdate: tTrainingsExtra.trainingExtraBirthdate,

            preferenceTrainingId: trainingsAssignmentsJoin.preferenceTrainingId,
            preferenceUpdated: trainingsAssignmentsJoin.preferenceUpdated,

            assignedTrainingId: trainingsAssignmentsJoin.assignmentTrainingId,
            assignedUpdated: trainingsAssignmentsJoin.assignmentUpdated,

            confirmed: trainingsAssignmentsJoin.assignmentConfirmed,
        })
        .orderBy(tTrainingsExtra.trainingExtraName, 'asc')
        .executeSelectMany();

    const trainings = await db.selectFrom(tTrainings)
        .where(tTrainings.eventId.equals(event.id))
            .and(tTrainings.trainingVisible.equals(/* true= */ 1))
        .select({
            id: tTrainings.trainingId,
            trainingAddress: tTrainings.trainingAddress,
            trainingCapacity: tTrainings.trainingCapacity,
            trainingStart: tTrainings.trainingStart,
            trainingEnd: tTrainings.trainingEnd,
        })
        .orderBy(tTrainings.trainingStart, 'asc')
        .executeSelectMany();

    // ---------------------------------------------------------------------------------------------
    // Assemble the training options that are available for this event
    // ---------------------------------------------------------------------------------------------

    const trainingOptions = [
        { value: 0, label: 'Skip the training' },
        ...trainings.map(training => ({
            value: training.id,
            label: dayjs(training.trainingStart).format('dddd, MMMM D'),
        })),
    ];

    // ---------------------------------------------------------------------------------------------
    // Combine the information to create a comprehensive assignment and confirmation tables
    // ---------------------------------------------------------------------------------------------

    const trainingAssignments: TrainingAssignment[] = [];
    const trainingConfirmations: TrainingConfirmation[] = [ [ /* todo */ ] ];

    for (const assignment of [ ...assignments, ...extraParticipants ]) {
        let preferredTrainingId: number | null | undefined = undefined;
        let assignedTrainingId: number | null | undefined = undefined;

        if (!!assignment.preferenceUpdated)
            preferredTrainingId = assignment.preferenceTrainingId ?? null;

        if (!!assignment.assignedUpdated)
            assignedTrainingId = assignment.assignedTrainingId ?? null;

        if ('trainingExtraName' in assignment) {
            trainingAssignments.push({
                id: `extra/${assignment.id}`,
                name: assignment.trainingExtraName,

                preferredTrainingId, assignedTrainingId,
                confirmed: !!assignment.confirmed,
            });
        } else {
            trainingAssignments.push({
                id: `user/${assignment.userId}`,
                name: assignment.name,

                userId: assignment.userId,
                team: assignment.team,

                preferredTrainingId, assignedTrainingId,
                confirmed: !!assignment.confirmed,
            });
        }
    }

    // Sort the training assignments first by confirmation state (unconfirmed participation comes
    // first), then alphabetically by name of the participant.
    trainingAssignments.sort((lhs, rhs) => {
        if (lhs.confirmed !== rhs.confirmed)
            return lhs.confirmed ? -1 : 1;

        return lhs.name.localeCompare(rhs.name);
    });

    return (
        <>
            <Collapse in={trainingConfirmations.length > 0} sx={{ mt: '-16px !important' }}>
                <TrainingOverview confirmations={trainingConfirmations} />
            </Collapse>
            <Collapse in={event.publishTrainings && trainingAssignments.length > 0}
                      sx={{ mt: '0px !important' }}>
                <TrainingAssignments assignments={trainingAssignments}
                                     trainings={trainingOptions} />
            </Collapse>
            <TrainingExternal event={event} participants={extraParticipants}
                              trainings={trainingOptions} />
            <TrainingConfiguration event={event} trainings={trainings} />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Trainings');
