// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextPageParams } from '@lib/NextRouterParams';
import { LocationPage } from './LocationPage';

/**
 * The <ScheduleLocationPage> component displays an overview of a location and the events that will
 * be happening therein. Only information contained within the context will be consumed, so no
 * additional security checks have to be done.
 */
export default async function ScheduleLocationPage(props: NextPageParams<'event' | 'location'>) {
    return <LocationPage locationId={(await props.params).location} />;
}
