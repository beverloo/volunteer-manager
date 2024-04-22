// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Privilege } from '@lib/auth/Privileges';
import { Section } from '../../components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleHelpRequestPage> component displays a page for a given help request. It's only
 * available for volunteers with a specific permission, as it potentially could contain sensitive
 * information.
 */
export default async function ScheduleHelpRequestPage(props: NextPageParams<'event' | 'id'>) {
    await requireAuthenticationContext({
        check: 'event',
        event: props.params.event,
        privilege: Privilege.EventHelpRequests,
    });

    return (
        <Section>
            <Typography variant="body1">
                This page is not available yet (/help-requests/:id)
            </Typography>
        </Section>
    );
}
