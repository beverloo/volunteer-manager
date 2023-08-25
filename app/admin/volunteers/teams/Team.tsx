// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { Role } from './Roles';

/**
 * Props accepted by the <Team> component.
 */
export interface TeamProps {
    /**
     * The roles that are availble on the Volunteer Manager. Teams are composed of people in various
     * different roles, which can be selected in this component.
     */
    roles: Role[];

    /**
     * Information about the team that this component is representing.
     */
    team: {
        /**
         * Unique ID of the team as it is represented in the database.
         */
        id: number;

        /**
         * Name of the team. Should be nice and short.
         */
        teamName: string;

        /**
         * Description of the team. Will be displayed on the homepage. Supports Markdown.
         */
        teamDescription: string;

        /**
         * Name of the environment (domain name) that this team represents.
         */
        teamEnvironment: string;
    };
}

/**
 * The <Team> component represents the state and settings for an individual team. Each of the
 * settings can be changed immediately.
 */
export function Team(props: TeamProps) {
    const { team } = props;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                {team.teamName.replace(/s$/, '')} team
                <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                    ({team.teamEnvironment})
                </Typography>
            </Typography>
        </Paper>
    );
}
