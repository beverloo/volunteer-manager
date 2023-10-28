// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { RetentionDataTable } from './RetentionDataTable';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The retention page displays a recruiting tool to understand how participants from the past two
 * events are interested in participating in the upcoming event.
 */
export default async function EventTeamRetentionPage(props: NextRouterParams<'slug' | 'team'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);

    return (
        <>
            { /* TODO: Volunteer-specific TODO list */ }
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5">
                    {team.name.replace(/s$/, '')} retention
                    <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                        ({event.shortName})
                    </Typography>
                </Typography>
                <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                    This table displays <strong>{team.name.replace(/s$/, '')} retention </strong>
                    considering the two previous events. Contact information will be revealed when
                    you <em>claim</em> a volunteer.
                </Alert>
                <RetentionDataTable event={event.slug} team={team.slug} />
            </Paper>
        </>
    )
}
