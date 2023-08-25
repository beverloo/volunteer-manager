// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import type { FieldValues, TextFieldElementProps } from 'react-hook-form-mui';
import { FormContainer, TextareaAutosizeElement, TextFieldElement, useFormContext }
    from 'react-hook-form-mui';

import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { deepmerge } from '@mui/utils';

import type { Role } from './Roles';
import type { UpdateTeamDefinition } from '@app/api/admin/updateTeam';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { issueServerAction } from '@app/lib/issueServerAction';

/**
 * Custom styles applied to the <Team> & related components.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    colorPreview: {
        borderRadius: 1,
        width: '40px',
    },
};

/**
 * The <ColorFieldElement> component is a regular text field element, but with a previous of the
 * configured color displayed right next to it.
 */
function ColorFieldElement(props: TextFieldElementProps) {
    const { watch } = useFormContext();

    return (
        <Stack direction="row" spacing={2}>
            <TextFieldElement {...props} sx={{ flexBasis: '100%' }} />
            <Box sx={deepmerge({ backgroundColor: watch(props.name) }, kStyles.colorPreview)} />
        </Stack>
    );
}

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
         * Name of the environment (domain name) that this team represents.
         */
        teamEnvironment: string;

    } & UpdateTeamDefinition['request'];
}

/**
 * The <Team> component represents the state and settings for an individual team. Each of the
 * settings can be changed immediately.
 */
export function Team(props: TeamProps) {
    const { team } = props;

    // TODO: Roles

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
                                          onChange={handleChange} required />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="teamTitle" label="Title" fullWidth size="small"
                                          onChange={handleChange} required />
                    </Grid>
                    <Grid xs={12}>
                        <TextareaAutosizeElement name="teamDescription" label="Description"
                                                 fullWidth onChange={handleChange} required />
                    </Grid>
                    <Grid xs={6}>
                        <ColorFieldElement name="teamColourLightTheme" label="Light theme color"
                                           size="small" onChange={handleChange} required />
                    </Grid>
                    <Grid xs={6}>
                        <ColorFieldElement name="teamColourDarkTheme" label="Dark theme color"
                                           size="small" onChange={handleChange} required />
                    </Grid>
                </Grid>
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}
