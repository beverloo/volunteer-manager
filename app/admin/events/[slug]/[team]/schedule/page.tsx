// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextPageParams } from '@lib/NextRouterParams';
import { ScheduleContextImpl } from './ScheduleContext';
import { ScheduleWarnings } from './ScheduleWarnings';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { readUserSettings } from '@lib/UserSettings';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { ScheduleImpl } from './ScheduleImpl';

/**
 * The Schedule page enables leads to build the comprehensive schedules defining where volunteers
 * will be helping out throughout the event. This is one of the most complex pages in our app, which
 * relies on the timeline component as well as data from many different sources.
 */
export default async function EventTeamSchedulePage(props: NextPageParams<'slug' | 'team'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);

    const userSettings = await readUserSettings(user.userId, [
        'user-admin-schedule-date',
        'user-admin-schedule-expand-warnings',
        'user-admin-schedule-inclusive-shifts',
    ]);

    const defaultContext = {
        date: userSettings['user-admin-schedule-date'],
        inclusiveShifts: userSettings['user-admin-schedule-inclusive-shifts'] ?? false,
    };

    return (
        <ScheduleContextImpl event={event} team={team} defaultContext={defaultContext}>
            <ScheduleImpl />
            <ScheduleWarnings
                defaultExpanded={ !!userSettings['user-admin-schedule-expand-warnings'] } />
        </ScheduleContextImpl>
    );
}

export const generateMetadata = generateEventMetadataFn('Schedule');
