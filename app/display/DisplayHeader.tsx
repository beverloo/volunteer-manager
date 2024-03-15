// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import WifiFindIcon from '@mui/icons-material/WifiFind';

import { DisplayContext, type DisplayContextInfo } from './DisplayContext';
import { Temporal, formatDate } from '@lib/Temporal';
import { refreshContext } from './DisplayController';

/**
 * Component that displays the current time, following the device's local timezone. It will update
 * every minute automatically, although the internal state is updated more frequently.
 */
function CurrentTime(props: { timezone?: string }) {
    const [ date, setDate ] = useState(Temporal.Now.zonedDateTimeISO(props.timezone));

    useEffect(() => {
        const timer = setInterval(() => {
            setDate(Temporal.Now.zonedDateTimeISO(props.timezone));
        }, /* 5 seconds= */ 5000);

        return () => clearInterval(timer);
    });

    return formatDate(date, 'HH:mm');
}

/**
 * The <DisplayHeaderMenuWarning> component displays a warning that's to be displayed in the menu,
 * to inform the reader that something is very wrong.
 */
function DisplayHeaderMenuWarning(props: React.PropsWithChildren) {
    return (
        <Alert severity="error" sx={{ backgroundColor: '#4e0000', color: '#ffffff' }}>
            {props.children}
        </Alert>
    );
}

/**
 * Component that will display the drawer menu for the display. Some basic display configuration
 * should be available here (such as brightness), as well as environmental and device information.
 */
function DisplayHeaderMenu(props: { context?: DisplayContextInfo }) {
    const { context } = props;

    const router = useRouter();

    const [ devEnvironmentDisabled, setDevEnvironmentDisabled ] = useState<boolean>(false);
    useEffect(() => {
        setDevEnvironmentDisabled(false);
        if (!!context && !!context.devEnvironment) {
            try {
                const currentUrl = new URL(window.location.href);
                const devUrl = new URL(context.devEnvironment);

                if (currentUrl.host === devUrl.host) {
                    setDevEnvironmentDisabled(true);
                    return;
                }
            } catch (error: any) {
                console.error(`Invalid devEnvironment setting: ${context.devEnvironment}`);
            }
        }
    }, [ context ]);

    const navigateToDevEnvironment = useCallback(() => {
        if (!!context?.devEnvironment)
            router.push(context.devEnvironment);

    }, [ context?.devEnvironment, router ]);

    // TODO: Brightness control
    // TODO: IP addresses
    // TODO: Refresh

    return (
        <Stack direction="column" justifyContent="space-between" sx={{ height: '100%' }}>
            <Stack direction="column" spacing={2}>
                { !context &&
                    <DisplayHeaderMenuWarning>
                        The display is not able to reach the provisioning server. Please ask a
                        volunteering lead for assistance.
                    </DisplayHeaderMenuWarning> }
                { (!!context && !context.provisioned) &&
                    <DisplayHeaderMenuWarning>
                        This display has not been provisioned yet. Please ask a volunteering lead
                        for assistance.
                    </DisplayHeaderMenuWarning> }
            </Stack>
            <Stack direction="row" divider={ <Divider orientation="vertical" flexItem /> }
                   justifyContent="flex-end" spacing={2}>
                <IconButton disabled={devEnvironmentDisabled} onClick={navigateToDevEnvironment}>
                    <DeveloperBoardIcon />
                </IconButton>
                <IconButton>
                    <WifiFindIcon />
                </IconButton>
            </Stack>
        </Stack>
    );
}

/**
 * The <DisplayHeader> component displays the Display's header bar, which contains the logo, name,
 * current time and an overflow menu granting access to device configuration.
 */
export function DisplayHeader() {
    const context = useContext(DisplayContext);

    const [ menuOpen, setMenuOpen ] = useState<boolean>(true);

    const handleCloseMenu = useCallback(() => setMenuOpen(false), [ /* no dependencies */ ]);
    const handleOpenMenu = useCallback(() => setMenuOpen(true), [ /* no dependencies */ ]);

    return (
        <>
            <Paper elevation={0} sx={{ px: 2, py: 1, background: 'none' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="h1" sx={{ pb: .5 }}>
                            { context?.label ?? 'AnimeCon Display' }
                        </Typography>
                        <Typography variant="subtitle1">
                            AnimeCon Volunteering Teams
                        </Typography>
                    </Box>
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={3}
                            divider={ <Divider orientation="vertical" flexItem /> }>
                            <Typography variant="h2" sx={{ pr: 1.75 }}>
                                <CurrentTime />
                            </Typography>
                            <IconButton size="large" onClick={handleOpenMenu}>
                                <MenuIcon color="disabled" />
                            </IconButton>
                        </Stack>
                    </Box>
                </Stack>
            </Paper>
            <Drawer anchor="right" onClose={handleCloseMenu} open={menuOpen}
                    PaperProps={{ sx: { width: '350px', p: 4 } }}>
                <DisplayHeaderMenu context={context} />
            </Drawer>
        </>
    );
}
