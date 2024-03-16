// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import WifiFindIcon from '@mui/icons-material/WifiFind';

import { DisplayContext, type DisplayContextInfo } from './DisplayContext';
import { Temporal, formatDate } from '@lib/Temporal';
import { refreshContext } from './DisplayController';
import device from './lib/Device';

/**
 * Global value indicating the brightness of the device. Used to consistently represent the value
 * in the slider even when the component gets remounted.
 */
let globalBrightnessValue: number = 50;

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
 * The <DisplayHeaderMenuBrightness> component displays a brightness control, through which the
 * intensity of the display's screen can be controlled.
 */
function DisplayHeaderMenuBrightness() {
    const [ currentOperation, setCurrentOperation ] = useState<Promise<boolean> | undefined>();
    const [ value, setValue ] = useState<number>(globalBrightnessValue);

    const handleChange = useCallback((event: unknown, value: number | number[]) => {
        if (typeof value !== 'number')
            return;  // make TypeScript happy

        globalBrightnessValue = value;
        setValue(value);

    }, [ /* no dependencies */ ]);

    const handleChangeCommitted = useCallback((event: unknown, value: number | number[]) => {
        if (typeof value !== 'number')
            return;  // make TypeScript happy

        setCurrentOperation(currentOperation => {
            if (!!currentOperation)
                return currentOperation.then(() => device.setBrightness(value));
            else
                return device.setBrightness(value);
        });
    }, [ /* no dependencies */ ]);

    return (
        <Box>
            <Typography variant="body1" gutterBottom>
                Screen brightness
            </Typography>
            <Slider value={value} min={10} max={250} step={10} shiftStep={10} color="secondary"
                    onChangeCommitted={handleChangeCommitted} onChange={handleChange} />
        </Box>
    );
}

/**
 * The <DisplayHeaderMenuIpAddresses> component displays a button that, when pressed, presents a
 * popover listing the IP addresses that have been assigned to the display.
 */
function DisplayHeaderMenuIpAddresses() {
    const [ anchorEl, setAnchorEl ] = useState<HTMLButtonElement | undefined>();
    const [ ipAddresses, setIpAddresses ] = useState<string[]>([ /* empty state */ ]);

    const handleClose = useCallback(() => {
        setAnchorEl(undefined);
        setTimeout(() => setIpAddresses([ ]), 300);
    }, [ /* no dependencies */ ]);

    const handleOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
        device.getIpAddresses().then(ipAddresses => {
            if (!!ipAddresses)
                setIpAddresses(ipAddresses.sort());
        });
    }, [ /* no dependencies */ ]);

    return (
        <>
            <IconButton onClick={handleOpen}>
                <WifiFindIcon />
            </IconButton>
            <Popover anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}
                     anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                     transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                     slotProps={{ paper: { sx: { backgroundColor: '#15191c' } } }}>
                <Box sx={{ p: 2, pb: 1 }}>
                    { !ipAddresses.length && <CircularProgress color="inherit" size={24} /> }
                    { !!ipAddresses.length &&
                        <List dense disablePadding>
                            {ipAddresses.map(ipAddress =>
                                <ListItem key={ipAddress}>
                                    <ListItemText primary={ipAddress} />
                                </ListItem> )}
                        </List> }
                </Box>
            </Popover>
        </>
    );
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

    // TODO: Last check-in time confirmation
    // TODO: Local unlock ability
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
                <DisplayHeaderMenuBrightness />
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                    { !!context &&
                        <Chip label={context.identifier} size="small" sx={{ pt: 0.25 }} /> }
                </Box>
                <Stack direction="row" divider={ <Divider orientation="vertical" flexItem /> }
                       spacing={2}>
                    <IconButton disabled={devEnvironmentDisabled}
                                onClick={navigateToDevEnvironment}>
                        <DeveloperBoardIcon />
                    </IconButton>
                    <DisplayHeaderMenuIpAddresses />
                </Stack>
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
