// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { FieldValues, TextFieldElementProps } from '@proxy/react-hook-form-mui';
import {
    AutocompleteElement, FormContainer, SelectElement, TextFieldElement, TextareaAutosizeElement,
    useFormContext } from '@proxy/react-hook-form-mui';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { deepmerge } from '@mui/utils';

import type { UpdateTeamDefinition } from '@app/api/admin/updateTeam';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { callApi } from '@lib/callApi';

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
interface TeamProps {
    /**
     * The roles that are availble on the Volunteer Manager. Teams are composed of people in various
     * different roles, which can be selected in this component.
     */
    roles: {
        id: number;
        roleName: string;
    }[];

    /**
     * Information about the team that this component is representing.
     */
    team: {
        /**
         * Unique slug that identifies this team in URLs.
         */
        teamSlug: string;

        /**
         * The roles that exist for this team.
         */
        roles: {
            /**
             * ID of the role, must exist in the `TeamProps['roles']` property.
             */
            roleId: number;

            /**
             * Whether this role is the default assignment for new registrations.
             */
            roleDefault: boolean;
        }[];
    } & Omit<UpdateTeamDefinition['request'], 'teamDefaultRole' | 'teamRoles'>;
}

/**
 * The <Team> component represents the state and settings for an individual team. Each of the
 * settings can be changed immediately.
 */
export function Team(props: TeamProps) {
    const { team } = props;

    // `roles` - a Map<> between the ID of a role and its name
    // `roleOptions` - an array with the numeric IDs of valid roles that can be chosen
    // `teamRoleSelection` - an array with the numeric IDs of roles selected for this team
    const [ roles, roleOptions, teamRoleSelection ] = useMemo(() => ([
        new Map<number, string>(props.roles.map(({ id, roleName }) => [ id, roleName ])),
        props.roles.map(({ id }) => ({ id })),
        props.team.roles.map(({ roleId }) => ({ id: roleId })),
    ]), [ props.roles, props.team.roles ]);

    // Default values that apply to the form ahead of any user mutations.
    const defaultValues = useMemo(() => ({
        teamDefaultRole: props.team.roles.find(({ roleDefault }) => roleDefault)?.roleId,
        teamRoles: teamRoleSelection,
        ...team,
    }), [ props.team.roles, team, teamRoleSelection ]);

    // ---------------------------------------------------------------------------------------------
    // Basic form behaviour
    // ---------------------------------------------------------------------------------------------

    const [ error, setError ] = useState<string>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        try {
            const result = await callApi('post', '/api/admin/update-team', {
                ...data as UpdateTeamDefinition['request'],

                teamDefaultRole: data.teamDefaultRole,
                teamRoles: data.teamRoles.map(({ id }: any) => id),

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

    // ---------------------------------------------------------------------------------------------
    // Roles & Default role behaviour
    // ---------------------------------------------------------------------------------------------

    const [ roleSelection, setRoleSelection ] = useState(teamRoleSelection);
    const [ defaultRoleOptions, setDefaultRoleOptions ] = useState(teamRoleSelection);

    const handleTeamRolesChange = useCallback((event: unknown, value: any) => {
        setRoleSelection(value);
        setInvalidated(true);
    }, [ /* no deps */ ]);

    useEffect(() => {
        setDefaultRoleOptions(roleSelection.map(({ id }) => ({
            label: roles.get(id),
            id,
        })));
    }, [ roleSelection, roles ]);

    const getOptionLabel =
        useCallback((option: any) => roles.get(option.id) ?? `Unknown (#${option.id})`, [ roles ]);

    // ---------------------------------------------------------------------------------------------

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                {team.teamName.replace(/s$/, '')} team
                <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                    ({team.teamSlug})
                </Typography>
            </Typography>
            <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
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
                        <AutocompleteElement name="teamRoles" label="Roles" options={roleOptions}
                                             multiple required
                                             autocompleteProps={{
                                                 fullWidth: true,
                                                 getOptionLabel,
                                                 onChange: handleTeamRolesChange,
                                                 size: 'small'
                                             }} />
                    </Grid>
                    <Grid xs={6}>
                        <SelectElement name="teamDefaultRole" label="Default role" size="small"
                                       required fullWidth options={defaultRoleOptions}
                                       onChange={handleChange} />
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
