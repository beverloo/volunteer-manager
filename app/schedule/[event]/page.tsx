// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextPageParams } from '@lib/NextRouterParams';
import { OverviewPage } from './OverviewPage';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleMainPage> component contains the main page of the schedule, that shows an overview
 * of the things we'd like the volunteer to know about.
 */
export default async function ScheduleMainPage(props: NextPageParams<'event'>) {
    await requireAuthenticationContext({ check: 'event', event: props.params.event });
    return <OverviewPage />;
}
