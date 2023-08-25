// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import { type FieldValues, FormContainer, TextareaAutosizeElement, TextFieldElement }
    from 'react-hook-form-mui';

import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { Role } from './Roles';
import type { UpdateTeamDefinition } from '@app/api/admin/updateTeam';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { issueServerAction } from '@app/lib/issueServerAction';

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
         * Title of the team as it should be presented to users.
         */
        teamTitle: string;

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

    // TODO: Roles
    // TODO: Colour scheme

    const [ error, setError ] = useState<string>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleChange = useCallback(() => setInvalidated(true), [ setInvalidated ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        try {
            const result = await issueServerAction<UpdateTeamDefinition>('/api/admin/update-team', {
                ...data as UpdateTeamDefinition['request'],
                id: team.id,
            });

            if (result.success)
                setInvalidated(false);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ team ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                {team.teamName.replace(/s$/, '')} team
                <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                    ({team.teamEnvironment})
                </Typography>
            </Typography>
            <FormContainer defaultValues={team} onSuccess={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid xs={6}>
                        <TextFieldElement name="teamName" label="Name" fullWidth size="small"
                                          onChange={handleChange} />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="teamTitle" label="Title" fullWidth size="small"
                                          onChange={handleChange} />
                    </Grid>
                    <Grid xs={12}>
                        <TextareaAutosizeElement name="teamDescription" label="Description"
                                                 fullWidth onChange={handleChange} />
                    </Grid>
                </Grid>
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}
