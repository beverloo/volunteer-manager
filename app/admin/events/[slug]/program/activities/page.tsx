// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { ActivityDataTable } from './ActivityDataTable';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The <ProgramActivitiesPage> component contains the activities that are part of the program of a
 * particular event. Each activity can link through to a detail page.
 */
export default async function ProgramActivitiesPage(props: NextRouterParams<'slug'>) {
    const { event } = await verifyAccessAndFetchPageInfo(props.params);
    if (!event.festivalId)
        notFound();

    return <ActivityDataTable event={event.slug} />;
}

export const generateMetadata = generateEventMetadataFn('Activities');
