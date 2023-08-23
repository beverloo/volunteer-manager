// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, FormContainer, SelectElement } from 'react-hook-form-mui';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import LoadingButton from '@mui/lab/LoadingButton';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import MoveUpIcon from '@mui/icons-material/MoveUp';
import Paper from '@mui/material/Paper';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { PageInfoWithTeam } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { UserData } from '@lib/auth/UserData';
import type { VolunteerRolesDefinition } from '@app/api/admin/volunteerRoles';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { issueServerAction } from '@app/lib/issueServerAction';
import { kStyles } from '@app/admin/volunteers/[id]/Header';


/**
 * Props accepted by the <ChangeRoleDialog> dialog.
 */
interface ChangeRoleDialogProps {
    /**
     * Callback function that should be called when the dialog is being closed.
     */
    onClose: (refresh?: boolean) => void;

    /**
     * ID of the event for which the role might be changed.
     */
    eventId: number;

    /**
     * Whether the dialog is currently open.
     */
    open?: boolean;

    /**
     * The roles that are available for the current team.
     */
    roles: NonNullable<VolunteerRolesDefinition['response']['roles']>;

    /**
     * ID of the team for which the role might be changed.
     */
    teamId: number;

    /**
     * The volunteer for whom this dialog is being displayed.
     */
    volunteer: HeaderProps['volunteer'];
}

/**
 * The <ChangeRoleDialog> dialog allows certain people to change the roles assigned to volunteers.
 * The list of available roles will be fetched on first load.
 */
function ChangeRoleDialog(props: ChangeRoleDialogProps) {
    const { eventId, onClose, open, roles, teamId, volunteer } = props;

    const options = useMemo(() => {
        return roles ? roles.map(role => ({ id: role.roleId, label: role.roleName })) : [];
    }, [ roles ]);

    const [ loading, setLoading ] = useState<boolean>(false);
    const [ success, setSuccess ] = useState<boolean>(false);

    const [ selectedRole, setSelectedRole ] = useState<number>(volunteer.roleId);
    const [ adminWarning, setAdminWarning ] = useState<boolean>(false);

    const handleChange = useCallback((value: any) => setSelectedRole(value), [ setSelectedRole ]);
    const handleClose = useCallback(() => onClose(/* refresh= */ false), [ onClose ]);
    const handleUpdate = useCallback(async (data: FieldValues) => {
        setLoading(true);
        try {
            const response = await issueServerAction<VolunteerRolesDefinition>(
                '/api/admin/volunteer-roles', {
                    eventId,
                    roleId: data.role,
                    teamId,
                    userId: volunteer.userId,
                });

            setSuccess(!!response.success);
        } finally {
            setLoading(false);
        }
    }, [ eventId, setLoading, setSuccess, teamId, volunteer ]);

    useEffect(() => {
        for (const { roleId, roleAdminAccess } of roles ?? []) {
            if (roleId !== selectedRole)
                continue;

            setAdminWarning(roleAdminAccess);
            return;
        }
        setAdminWarning(false);
    }, [ roles, selectedRole, setAdminWarning ])

    return (
        <Dialog open={!!open} onClose={handleClose} fullWidth>
            <FormContainer defaultValues={{ role: volunteer.roleId }} onSuccess={handleUpdate}>
                <DialogTitle>
                    Change role
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ pb: 2 }}>
                        You can change the role that <strong>{volunteer.firstName}</strong> has been
                        assigned, which defines our expectations for them during the event.
                    </Typography>
                    <SelectElement name="role" label="Role" size="small" fullWidth
                                   options={options} onChange={handleChange} />

                    <Collapse in={!!adminWarning}>
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            This role will grant administration access to
                            <strong> {volunteer.firstName}</strong> for this event.
                        </Alert>
                    </Collapse>

                    <Collapse in={!!success}>
                        <Alert severity="success" sx={{ mt: 2 }}>
                            The role for <strong>{volunteer.firstName}</strong> has been updated.
                        </Alert>
                    </Collapse>
                </DialogContent>
                <DialogActions sx={{ pt: 0, mr: 2, mb: 2 }}>
                    <Button onClick={handleClose} variant="text">Close</Button>
                    <LoadingButton disabled={!!success} loading={loading} type="submit"
                                   variant="contained">
                        Update
                    </LoadingButton>
                </DialogActions>
            </FormContainer>
        </Dialog>
    );
}

/**
 * Props accepted by the <Header> component.
 */
export interface HeaderProps {
    /**
     * Information about the event this volunteer will participate in.
     */
    event: PageInfoWithTeam['event'];

    /**
     * Information about the team this volunteer is part of.
     */
    team: PageInfoWithTeam['team'];

    /**
     * Information about the volunteer for whom this page is being displayed.
     */
    volunteer: {
        /**
         * User ID of the volunteer who this page is representing.
         */
        userId: number;

        /**
         * The volunteer's first name.
         */
        firstName: string;

        /**
         * The volunteer's last name.
         */
        lastName: string;

        /**
         * ID of the role that is assigned to the volunteer.
         */
        roleId: number;

        /**
         * The status of the volunteer's registration in the current event.
         */
        registrationStatus: RegistrationStatus;
    };

    /**
     * The user who is signed in to their account. Used for access checks.
     */
    user: UserData;
}

/**
 * The <Header> component indicates which volunteer is being shown, and provides a series of actions
 * to change their participation. The exact actions depend on the access level of the user.
 */
export function Header(props: HeaderProps) {
    const { event, team, volunteer, user } = props;

    const router = useRouter();

    // TODO: Cancel
    // TODO: Reinstante
    // TODO: Change team

    const [ roles, setRoles ] = useState<VolunteerRolesDefinition['response']['roles']>();
    const [ rolesLoading, setRolesLoading ] = useState<boolean>(false);
    const [ rolesOpen, setRolesOpen ] = useState<boolean>(false);

    const handleRolesClose = useCallback(() => setRolesOpen(false), [ setRolesOpen ]);
    const handleRolesOpen = useCallback(async () => {
        if (!roles) {
            setRolesLoading(true);
            try {
                const response = await issueServerAction<VolunteerRolesDefinition>(
                    '/api/admin/volunteer-roles', {
                        teamId: team.id,
                    });

                setRoles(response.roles);
            } finally {
                setRolesLoading(false);
            }
        }
        setRolesOpen(true);
    }, [ roles, setRoles, setRolesLoading, setRolesOpen, team ]);

    const navigateToAccount = useCallback(() => {
        router.push(`/admin/volunteers/${volunteer.userId}`)
    }, [ router, volunteer ] );

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                {volunteer.firstName} {volunteer.lastName}
                <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                    ({event.shortName} {team.name})
                </Typography>
            </Typography>
            <Stack sx={kStyles.options} divider={ <Divider orientation="vertical" flexItem /> }
                   direction="row" spacing={1}>

                { can(user, Privilege.VolunteerAdministrator) &&
                    <Button onClick={navigateToAccount} startIcon={ <AccountCircleIcon /> }>
                        Account
                    </Button> }

                { volunteer.registrationStatus === RegistrationStatus.Accepted &&
                    <Button startIcon={ <DoNotDisturbIcon /> }>
                        Cancel participation
                    </Button> }

                { volunteer.registrationStatus === RegistrationStatus.Cancelled &&
                    <Button startIcon={ <SettingsBackupRestoreIcon /> }>
                        Reinstate volunteer
                    </Button> }

                { can(user, Privilege.EventAdministrator) &&
                    <Button startIcon={ <MoveUpIcon /> }>
                        Change team
                    </Button> }

                { can(user, Privilege.EventAdministrator) &&
                    <LoadingButton startIcon={ <ManageAccountsIcon /> } onClick={handleRolesOpen}
                                   loading={rolesLoading}>
                        Change role
                    </LoadingButton> }

            </Stack>
            <ChangeRoleDialog onClose={handleRolesClose} open={roles && rolesOpen}
                              roles={roles!} volunteer={volunteer} eventId={event.id}
                              teamId={team.id} />
        </Paper>
    );
}
