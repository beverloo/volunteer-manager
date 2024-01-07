// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { Privilege } from '@lib/auth/Privileges';
import { Timeline } from '@app/admin/components/Timeline';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';

/**
 * The <TimelineExperimentPage> component contains our experiments with the Timeline component, to
 * see how well the interface scales across our needs.
 */
export default async function TimelineExperimentPage() {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemAdministrator,
    });

    const event = await getEventBySlug('2024');
    if (!event)
        notFound();

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5">
                    Basic usage
                </Typography>
                <Timeline period={{ start: event.startTime, end: event.endTime }}
                          timezone={event.timezone} />
            </Paper>
        </>
    );
}
