// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import { NextRouterParams } from '@lib/NextRouterParams';
import { Privilege, can } from '@lib/auth/Privileges';
import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

export default async function EventTrainingPage(props: NextRouterParams<'slug'>) {
    const { event, user } = await verifyAccessAndFetchPageInfo(props.params);

    // Training management is more restricted than the general event administration.
    if (!can(user, Privilege.EventAdministrator))
        notFound();

    return (
        <UnderConstructionPaper>
            {event.shortName} trainings
        </UnderConstructionPaper>
    );
}

export const metadata: Metadata = {
    title: 'Event | Training',
};
