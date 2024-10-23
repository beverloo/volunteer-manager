// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { redirect } from 'next/navigation';

import type { NextPageParams } from '@lib/NextRouterParams';

/**
 * The <ScheduleEventsPage> is not supported right now, and redirects the user back to the overview.
 */
export default async function ScheduleEventsPage(props: NextPageParams<'event'>) {
    redirect(`/schedule/${(await props.params).event}`);
}
