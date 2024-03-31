// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Section } from '../components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleLocationsPage> component displays a list of all locations that are available on the
 * convention grounds. This is not a typically reachable page, but expected due to our URL layout.
 */
export default async function ScheduleLocationsPage(props: NextPageParams<'event'>) {
    await requireAuthenticationContext({ check: 'event', event: props.params.event });
    return (
        <Section>
            <Typography variant="body1">
                This page is not available yet (/locations)
            </Typography>
        </Section>
    );
}
