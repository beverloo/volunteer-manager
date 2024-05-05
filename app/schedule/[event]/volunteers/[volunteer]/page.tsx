// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Section } from '../../components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleVolunteerPage> component display a page for a particular volunteer, identified by
 * their userId in the URL. The volunteer page contains their schedule as well.
 */
export default async function ScheduleVolunteerPage(props: NextPageParams<'event' | 'volunteer'>)
{
    await requireAuthenticationContext({ check: 'event', event: props.params.event });
    return (
        <Section>
            <Typography variant="body1">
                This page is not available yet (/volunteers/:volunteer)
            </Typography>
        </Section>
    );
}
