// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';

import type { UpdatePermissionsDefinition } from '@app/api/admin/updatePermissions';
import { issueServerAction } from '@app/lib/issueServerAction';

import { PrivilegeGroups, PrivilegeNames, PrivilegeWarnings, Privilege }
    from '@app/lib/auth/Privileges';

/**
 * Custom styles applied to the <Permissions> component.
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
 * Props accepted by the <Permissions> component.
 */
export interface PermissionsProps {
    /**
     * ID of the user for whom permissions are being displayed.
     */
    userId: number;

    /**
     * The privileges that have been assigned to this user. Does not include privileges granted by
     * default or through participation in a particular event.
     */
    privileges: bigint;
}

/**
 * The <Permissions> component lists the permissions granted to this user, and allows for additional
 * permissions to be granted. Permissions are automatically generated. Only administrators get this.
 */
export function Permissions(props: PermissionsProps) {
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
            const response = await issueServerAction<UpdatePermissionsDefinition>(
                '/api/admin/update-permissions',
                {
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
            <Typography variant="h5">
                Global permissions
            </Typography>
            <Typography variant="body2" sx={{ pb: 1 }}>
                Permissions that will be granted to this volunteer regardless of their participation
                in an event. Only administrators have the ability to amend permissions.
            </Typography>
            <Grid container spacing={1}>
                { groups.map(group =>
                    <>
                        <Grid xs={12}>
                            <Typography variant="h6">
                                {group}
                            </Typography>
                        </Grid>
                        { Object.entries(PrivilegeNames).map(([ privilege, label ]) => {
                            const typedPrivilege = privilege as unknown as Privilege;
                            if (PrivilegeGroups[typedPrivilege] !== group)
                                return undefined;

                            const numericPrivilege = BigInt(privilege);
                            const checked = (privileges & numericPrivilege) === numericPrivilege;
                            const control =
                                <Checkbox size="small" checked={checked} value={privilege}
                                          onChange={ (e) => updatePrivilege(e.target) }/>;

                            return (
                                <Grid key={privilege+props.userId} xs={6} sx={{ py: 0.2 }}>

                                    <FormControlLabel control={control} label={label}
                                                      slotProps={{
                                                          typography: { variant: 'body2' }
                                                      }} />

                                    { PrivilegeWarnings.hasOwnProperty(privilege) &&
                                        <Collapse in={checked}>
                                            <Typography variant="body2" sx={kStyles.warning}>
                                                { PrivilegeWarnings[typedPrivilege] }
                                            </Typography>
                                        </Collapse> }

                                </Grid>
                            );
                        }) }
                    </>
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
