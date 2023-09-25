// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { PageInfoWithTeam } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { User } from '@lib/auth/User';

/**
 * Props accepted by the <Header> component.
 */
export interface HeaderProps {
    /**
     * Information about the event for which applications are being shown.
     */
    event: PageInfoWithTeam['event'];

    /**
     * Information about the team for which applications are being shown.
     */
    team: PageInfoWithTeam['team'];

    /**
     * The user for whom information is being shown.
     */
    user: User;
}

/**
 * The <Header> component explains which page the volunteer is on, and displays a warning when new
 * applications are no longer being accepted. These settings can be changed in Event Settings.
 */
export function Header(props: HeaderProps) {
    const { event, team, user } = props;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                {team.name.replace(/s$/, '')} applications
                <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                    ({event.shortName})
                </Typography>
            </Typography>
        </Paper>
    );
}
