// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Privilege, can } from '@lib/auth/Privileges';
import { ScheduleContextImpl } from './ScheduleContext';
import { ScheduleWarnings } from './ScheduleWarnings';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { readUserSettings } from '@lib/UserSettings';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { ScheduleImpl } from './ScheduleImpl';

/**
 * Data validation type for user-specific section expand settings.
 */
const kExpandSection = z.record(z.string(), z.boolean());

/**
 * The Schedule page enables leads to build the comprehensive schedules defining where volunteers
 * will be helping out throughout the event. This is one of the most complex pages in our app, which
 * relies on the timeline component as well as data from many different sources.
 */
export default async function EventTeamSchedulePage(props: NextPageParams<'slug' | 'team'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);

    const userSettings = await readUserSettings(user.userId, [
        'user-admin-schedule-date',
        'user-admin-schedule-expand-sections',
        'user-admin-schedule-expand-warnings',
        'user-admin-schedule-inclusive-shifts',
    ]);

    const defaultContext = {
        date: userSettings['user-admin-schedule-date'],
        inclusiveShifts: userSettings['user-admin-schedule-inclusive-shifts'] ?? false,
    };

    const readOnly = !can(user, Privilege.EventScheduleManagement);

    let sections: z.infer<typeof kExpandSection> = {};
    try {
        const unverifiedSections =
            JSON.parse(userSettings['user-admin-schedule-expand-sections'] ?? '{}');

        // Only populate the `settings` when it's both valid JSON, and validates per
        // `kExpandSection`. This avoid type violations in runtime.
        sections = kExpandSection.parse(unverifiedSections);

    } catch (error: any) {
        console.warn(`User ${user.userId} has invalid section expand configuration`);
    }

    return (
        <>
            { !!readOnly &&
                <Paper component={Alert} severity="warning">
                    Please ask your Staff member to add you to the scheduling team if you would like
                    to be able to make any changes.
                </Paper> }
            <ScheduleContextImpl event={event} team={team} defaultContext={defaultContext}>
                <ScheduleImpl readOnly={readOnly} sections={sections} />
                <ScheduleWarnings
                    defaultExpanded={ !!userSettings['user-admin-schedule-expand-warnings'] } />
            </ScheduleContextImpl>
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Schedule');
