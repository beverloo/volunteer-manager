// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Section } from '../../components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleEventPage> component display a page for a particular event. It lists information
 * about the event, its timeslots, as well as volunteers who are scheduled for those times.
 */
export default async function ScheduleEventPage(props: NextRouterParams<'event' | 'eventId'>) {
    await requireAuthenticationContext({ check: 'event', event: props.params.event });
    return (
        <Section>
            <Typography variant="body1">
                This page is not available yet (/events/:eventId)
            </Typography>
        </Section>
    );
}
