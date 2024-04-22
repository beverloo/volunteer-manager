// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Privilege } from '@lib/auth/Privileges';
import { Section } from '../components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleHelpRequestsPage> component displays a page containing the recent help requests. It
 * is only available to a subset of volunteers.
 */
export default async function ScheduleHelpRequestsPage(props: NextPageParams<'event'>) {
    await requireAuthenticationContext({
        check: 'event',
        event: props.params.event,
        privilege: Privilege.EventHelpRequests,
    });

    return (
        <Section>
            <Typography variant="body1">
                This page is not available yet (/help-requests)
            </Typography>
        </Section>
    );
}
