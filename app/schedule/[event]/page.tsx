// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextPageParams } from '@lib/NextRouterParams';
import { OverviewPage } from './OverviewPage';
import { generateScheduleMetadataFn } from './lib/generateScheduleMetadataFn';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleMainPage> component contains the main page of the schedule, that shows an overview
 * of the things we'd like the volunteer to know about.
 */
export default async function ScheduleMainPage(props: NextPageParams<'event'>) {
    const params = await props.params;
    await requireAuthenticationContext({ check: 'event', event: params.event });

    return <OverviewPage />;
}

export const generateMetadata = generateScheduleMetadataFn([ 'Schedule' ]);
