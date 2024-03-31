// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Section } from '../../components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleLocationPage> component displays an overview of a location and the events that will
 * be happening therein. The user will be automatically redirected when there's only a single event.
 */
export default async function ScheduleLocationPage(props: NextPageParams<'event' | 'location'>) {
    await requireAuthenticationContext({ check: 'event', event: props.params.event });
    return (
        <Section>
            <Typography variant="body1">
                This page is not available yet (/locations/:location)
            </Typography>
        </Section>
    );
}
