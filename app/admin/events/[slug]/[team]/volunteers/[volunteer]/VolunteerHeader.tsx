// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, SelectElement } from 'react-hook-form-mui';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
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
import type { User } from '@lib/auth/User';
import type { VolunteerRolesDefinition } from '@app/api/admin/volunteerRoles';
import { ContrastBox } from '@app/admin/components/ContrastBox';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { SettingDialog } from '@app/admin/components/SettingDialog';
import { issueServerAction } from '@lib/issueServerAction';

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
    volunteer: VolunteerHeaderProps['volunteer'];
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

    const [ selectedRole, setSelectedRole ] = useState<number>(volunteer.roleId);
    const [ warning, setWarning ] = useState<boolean>(false);

    const handleChange = useCallback((value: any) => setSelectedRole(value), [ setSelectedRole ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        const response = await issueServerAction<VolunteerRolesDefinition>(
            '/api/admin/volunteer-roles', {
                eventId,
                roleId: data.role,
                teamId,
                userId: volunteer.userId,
            });

        if (response.success)
            return { success: `${volunteer.firstName}'s role has been successfully updated.` };
        else
            return { error: `${volunteer.firstName}'s role could not be updated right now.` };

    }, [ eventId, teamId, volunteer ]);

    useEffect(() => {
        setSelectedRole(volunteer.roleId);
    }, [ open, setSelectedRole, volunteer ]);

    useEffect(() => {
        for (const { roleId, roleAdminAccess } of roles ?? []) {
            if (roleId !== selectedRole)
                continue;

            setWarning(roleAdminAccess);
            return;
        }
        setWarning(false);
    }, [ roles, selectedRole, setWarning ]);

    return (
        <SettingDialog defaultValues={{ role: volunteer.roleId }}
                       description={
                           <>
                               You can change the role that <strong>{volunteer.firstName} </strong>
                               has been assigned, defining what our expectations are for them
                               during the event.
                           </> }
                        onClose={onClose} onSubmit={handleSubmit} open={open}
                        title="Change role">

            <SelectElement name="role" label="Role" size="small" fullWidth
                           options={options} onChange={handleChange} sx={{ mt: 2 }} />

            <Collapse in={!!warning}>
                <Alert severity="warning" sx={{ mt: 2 }}>
                    This role will grant administration access to
                    <strong> {volunteer.firstName}</strong> for this event.
                </Alert>
            </Collapse>

        </SettingDialog>
    );
}

/**
 * Props accepted by the <VolunteerHeader> component.
 */
export interface VolunteerHeaderProps {
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
    user: User;
}

/**
 * The <VolunteerHeader> component indicates which volunteer is being shown, and provides actions
 * to change their participation. The exact actions depend on the access level of the user.
 */
export function VolunteerHeader(props: VolunteerHeaderProps) {
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
            <ContrastBox sx={{ mt: 1, px: 2, py: 1 }}>
                <Stack divider={ <Divider orientation="vertical" flexItem /> }
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
                        <LoadingButton startIcon={ <ManageAccountsIcon /> }
                                       onClick={handleRolesOpen} loading={rolesLoading}>
                            Change role
                        </LoadingButton> }

                </Stack>
            </ContrastBox>
            <ChangeRoleDialog onClose={handleRolesClose} open={roles && rolesOpen}
                              roles={roles!} volunteer={volunteer} eventId={event.id}
                              teamId={team.id} />
        </Paper>
    );
}
