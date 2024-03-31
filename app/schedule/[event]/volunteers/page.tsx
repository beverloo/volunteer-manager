// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Section } from '../components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleVolunteersPage> component display a page containing the volunteers that participate
 * in the current event, _and_ are accessible to the signed in volunteer.
 */
export default async function ScheduleVolunteersPage(props: NextRouterParams<'event'>) {
    await requireAuthenticationContext({ check: 'event', event: props.params.event });
    return (
        <Section>
            <Typography variant="body1">
                This page is not available yet (/volunteers)
            </Typography>
        </Section>
    );
}
