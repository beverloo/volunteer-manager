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

export default async function EventTrainingPage(props: NextRouterParams<'slug'>) {
    const { event, user } = await verifyAccessAndFetchPageInfo(props.params);

    // Training management is more restricted than the general event administration.
    if (!can(user, Privilege.EventTrainingManagement))
        notFound();

    return (
        <>
            <TrainingSelection />
            <TrainingPendingAssignment />
            <TrainingExternal />
            <TrainingConfiguration />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Trainings');
