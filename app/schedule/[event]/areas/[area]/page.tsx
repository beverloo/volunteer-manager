// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextPageParams } from '@lib/NextRouterParams';
import { LocationList } from './LocationList';
import { generateScheduleMetadata } from '../../lib/generateScheduleMetadataFn';

/**
 * The <ScheduleAreaPage> component displays an overview of the locations that are part of a given
 * area, together with information on what's currently happening within them. Authentication is
 * skipped as this page only consumes data already shared with the client.
 */
export default function ScheduleAreaPage(props: NextPageParams<'area' | 'event'>) {
    return <LocationList areaId={props.params.area} />;
}

export async function generateMetadata(props: NextPageParams<'area' | 'event'>) {
    // TODO: Plug in the `area` name
    return generateScheduleMetadata(props, [ 'Events' ]);
}
