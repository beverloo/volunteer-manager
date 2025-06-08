// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import SettingsIcon from '@mui/icons-material/Settings';
import Typography from '@mui/material/Typography';

import type { ServerAction } from '@lib/serverAction';
import { AccountSettingsForm, type AccountSettings } from './organisation/accounts/[id]/settings/AccountSettings';
import { ServerActionDialog } from './components/ServerActionDialog';

/**
 * Props accepted by the <AdminHeaderSettingsButton> component.
 */
interface AdminHeaderSettingsButtonProps {
    /**
     * Server action through which the user can save their settings.
     */
    saveSettingsFn: ServerAction;

    /**
     * Account settings that should be populated in the form by default.
     */
    settings: AccountSettings;
}

/**
 * The <AdminHeaderSettingsButton> component displays the signed in user's avatar, which, when
 * clicked on, opens a settings dialog that enables the user to update their configuration.
 */
export function AdminHeaderSettingsButton(
    props: React.PropsWithChildren<AdminHeaderSettingsButtonProps>)
{
    const [ settingsOpen, setSettingsOpen ] = useState<boolean>(false);

    const handleSettingsClose = useCallback(() => setSettingsOpen(false), [ /* no deps */ ]);
    const handleSettingsOpen = useCallback(() => setSettingsOpen(true), [ /* no deps */ ]);

    return (
        <>
            <Badge anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} overlap="circular"
                   onClick={handleSettingsOpen} sx={{ cursor: 'pointer' }}
                   badgeContent={
                       <Avatar sx={{
                           backgroundColor: 'primary.contrastText',
                           fontSize: '14px',
                           width: '16px',
                           height: '16px',
                       }}>
                          <SettingsIcon fontSize="inherit" color="primary" />
                       </Avatar>
                   }>
                {props.children}
            </Badge>

            { settingsOpen &&
                <ServerActionDialog action={props.saveSettingsFn} open={settingsOpen} maxWidth="md"
                                    onClose={handleSettingsClose} defaultValues={props.settings}
                                    title="Your account settings">
                    <Typography sx={{ mt: -1 }}>
                        These are your account settings—you're free to adjust them as you like to
                        make your admin experience even better.
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                        <AccountSettingsForm />
                    </Grid>
                </ServerActionDialog> }
        </>
    );
}
