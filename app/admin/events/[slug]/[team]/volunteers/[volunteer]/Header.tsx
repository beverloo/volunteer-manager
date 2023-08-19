// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import MoveUpIcon from '@mui/icons-material/MoveUp';
import Paper from '@mui/material/Paper';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { PageInfoWithTeam } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { UserData } from '@lib/auth/UserData';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { kStyles } from '@app/admin/volunteers/[id]/Header';

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
                    <Button startIcon={ <ManageAccountsIcon /> }>
                        Change role
                    </Button> }

            </Stack>
        </Paper>
    );
}
