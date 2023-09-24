// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Privilege, can } from '@lib/auth/Privileges';
import { TrainingConfiguration } from './TrainingConfiguration';
import { TrainingExternal } from './TrainingExternal';
import { TrainingPendingAssignment } from './TrainingPendingAssignment';
import { TrainingSelection } from './TrainingSelection';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tTrainings, tTrainingsExtra } from '@lib/database';

export default async function EventTrainingPage(props: NextRouterParams<'slug'>) {
    const { event, user } = await verifyAccessAndFetchPageInfo(props.params);

    // Training management is more restricted than the general event administration.
    if (!can(user, Privilege.EventTrainingManagement))
        notFound();

    const extraParticipants = await db.selectFrom(tTrainingsExtra)
        .where(tTrainingsExtra.eventId.equals(event.id))
            .and(tTrainingsExtra.trainingExtraVisible.equals(/* true= */ 1))
        .select({
            id: tTrainingsExtra.trainingExtraId,
            trainingExtraName: tTrainingsExtra.trainingExtraName,
            trainingExtraEmail: tTrainingsExtra.trainingExtraEmail,
            trainingExtraBirthdate: tTrainingsExtra.trainingExtraBirthdate,
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

    return (
        <>
            <TrainingSelection />
            <TrainingPendingAssignment />
            <TrainingExternal event={event} participants={extraParticipants} />
            <TrainingConfiguration event={event} trainings={trainings} />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Trainings');
