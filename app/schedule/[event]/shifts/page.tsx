// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Section } from '../components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleShiftsPage> component displays the regular volunteer page for the signed in user,
 * only available in case they have a role and shifts in the current event.
 */
export default async function ScheduleShiftsPage(props: NextPageParams<'event'>) {
    await requireAuthenticationContext({ check: 'event', event: props.params.event });
    return (
        <Section>
            <Typography variant="body1">
                This page is not available yet (/shifts)
            </Typography>
        </Section>
    );
}
