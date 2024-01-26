// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { SxProps, Theme } from '@mui/system';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import WarningIcon from '@mui/icons-material/Warning';
import { red } from '@mui/material/colors';

import { callApi } from '@lib/callApi';
import { PrivilegeGroups, PrivilegeNames, PrivilegeWarnings, Privilege }
    from '@lib/auth/Privileges';

/**
 * Custom styles applied to the <VolunteerPrivileges> component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    unsavedWarning: {
        backgroundColor: theme => theme.palette.mode === 'light' ? red[50] : red[900],
        borderRadius: 1,
        padding: 1,
    },
    warning: {
        borderLeft: theme => `4px solid ${theme.palette.error.main}`,
        color: 'error.main',
        marginLeft: 2,
        paddingLeft: 1,
    }
};

/**
 * Props accepted by the <VolunteerPrivileges> component.
 */
export interface VolunteerPrivilegesProps {
    /**
     * ID of the user for whom privileges are being displayed.
     */
    userId: number;

    /**
     * The privileges that have been assigned to this user. Does not include privileges granted by
     * default or through participation in a particular event.
     */
    privileges: bigint;
}

/**
 * The <VolunteerPrivileges> component lists the privileges granted to this user, and allows for
 * additional privileges to be granted. Permissions are automatically generated.
 */
export function VolunteerPrivileges(props: VolunteerPrivilegesProps) {
    const groups = [ ...new Set(Object.values(PrivilegeGroups)) ];
    const router = useRouter();

    const [ savedPrivileges, setSavedPrivileges ] = useState(props.privileges);
    const [ privileges, setPrivileges ] = useState(props.privileges);

    const updatePrivilege = useCallback((input: HTMLInputElement) => {
        const numericPrivilege = BigInt(input.value);
        if (input.checked)
            setPrivileges(privileges | numericPrivilege);
        else
            setPrivileges(privileges & ~numericPrivilege);

    }, [ privileges ]);

    const [ loading, setLoading ] = useState(false);

    const save = useCallback(async () => {
        setLoading(true);
        try {
            const response = await callApi('post', '/api/admin/update-permissions', {
                userId: props.userId,
                privileges: privileges.toString(),
            });

            if (!response.success) {
                console.warn('Unable to update permissions for this user.');
            } else {
                setSavedPrivileges(privileges);
                router.refresh();
            }

        } finally {
            setLoading(false);
        }

    }, [ props.userId, privileges, router ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Volunteer Manager Privileges
            </Typography>
            <Alert severity="warning" sx={{ mb: 1 }}>
                Privileges are granted in addition to event-based administrative access. Only
                administrators have the ability to amend privileges.
            </Alert>
            <Grid container spacing={1}>
                { groups.map(group =>
                    <React.Fragment key={group}>
                        <Grid xs={12}>
                            <Typography variant="h6">
                                {group}
                            </Typography>
                        </Grid>
                        { Object.entries(PrivilegeNames).map(([ privilege, name ]) => {
                            const typedPrivilege = privilege as unknown as Privilege;
                            if (PrivilegeGroups[typedPrivilege] !== group)
                                return undefined;

                            const numericPrivilege = BigInt(privilege);
                            const checked = (privileges & numericPrivilege) === numericPrivilege;

                            const label =
                                <>
                                    {name}
                                    { PrivilegeWarnings.hasOwnProperty(privilege) &&
                                        <Tooltip title={PrivilegeWarnings[typedPrivilege]}>
                                            <WarningIcon color="warning" fontSize="small"
                                                         sx={{ verticalAlign: 'sub', ml: 0.75 }} />
                                        </Tooltip> }
                                </>;

                            const control =
                                <Checkbox size="small" checked={checked} value={privilege}
                                          onChange={ (e) => updatePrivilege(e.target) }/>;

                            return (
                                <Grid key={privilege+props.userId} xs={6} sx={{ py: 0.2 }}>
                                    <FormControlLabel control={control} label={label}
                                                      slotProps={{
                                                          typography: { variant: 'body2' }
                                                      }} />
                                </Grid>
                            );
                        }) }
                    </React.Fragment>
                ) }
                <Grid xs={12}>
                    <Collapse in={privileges !== savedPrivileges}>
                        <Box sx={kStyles.unsavedWarning}>
                            <LoadingButton loading={loading} variant="contained" onClick={save}>
                                Save changes
                            </LoadingButton>
                        </Box>
                    </Collapse>
                </Grid>
            </Grid>
        </Paper>
    );
}
