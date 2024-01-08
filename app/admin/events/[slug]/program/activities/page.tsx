// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Alert from '@mui/material/Alert';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The <ProgramActivitiesPage> component contains the activities that are part of the program of a
 * particular event. Each activity can link through to a detail page.
 */
export default async function ProgramActivitiesPage(props: NextRouterParams<'slug'>) {
    const { event } = await verifyAccessAndFetchPageInfo(props.params);

    return (
        <Alert severity="warning" sx={{ m: 2 }}>
            This page has not been implemented yet. (ProgramActivitiesPage, {props.params.slug})
        </Alert>
    );
}
