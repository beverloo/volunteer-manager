// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { SvgIconProps } from '@mui/material/SvgIcon';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DisplayContext } from './DisplayContext';
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
 * The <DisplayHeader> component displays the Display's header bar, which contains the logo, name,
 * current time and an overflow menu granting access to device configuration.
 */
export function DisplayHeader() {
    const context = useContext(DisplayContext);
    const router = useRouter();

    const [ showDevEnvironment, setShowDevEnvironment ] = useState<boolean>(false);

    const handleDevEnvironment = useCallback(() => {
        if (!!context?.devEnvironment)
            router.push(context.devEnvironment);

    }, [ context?.devEnvironment, router ]);

    useEffect(() => {
        if (!!context && !!context.devEnvironment) {
            try {
                const currentUrl = new URL(window.location.href);
                const devUrl = new URL(context.devEnvironment);

                if (currentUrl.host !== devUrl.host) {
                    setShowDevEnvironment(true);
                    return;
                }
            } catch (error: any) {
                console.error(`Invalid devEnvironment setting: ${context.devEnvironment}`);
            }
        }

        setShowDevEnvironment(false);

    }, [ context ]);

    const [ refreshActive, setRefreshActive ] = useState<boolean>(false);
    const [ refreshResult, setRefreshResult ] = useState<SvgIconProps['color']>('inherit');

    const handleRefresh = useCallback(async () => {
        setRefreshActive(true);
        setRefreshResult(/* default= */ 'inherit');
        setRefreshResult(await refreshContext() ? 'success' : 'error');
        setRefreshActive(false);
        setTimeout(() => setRefreshResult(/* default= */ 'inherit'), 2500);
    }, [ /* no dependencies */ ]);

    return (
        <Paper sx={{ px: 2, py: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Typography variant="h5">
                    { context?.label ?? 'AnimeCon Volunteering Teams' }
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}
                       divider={ <Divider orientation="vertical" flexItem /> }>
                    <Typography variant="button" sx={{ pr: 1 }}>
                        <CurrentTime timezone={context?.timezone} />
                    </Typography>
                    { !!refreshActive &&
                        <Box sx={{ px: 1, pt: 0.75 }}>
                            <CircularProgress color="inherit" size={24} />
                        </Box> }
                    { !refreshActive &&
                        <IconButton onClick={handleRefresh}>
                            <RefreshIcon color={refreshResult} />
                        </IconButton> }
                    { !!showDevEnvironment &&
                        <IconButton onClick={handleDevEnvironment}>
                            <DeveloperBoardIcon color="inherit" />
                        </IconButton> }
                    <IconButton>
                        <SettingsIcon />
                    </IconButton>
                </Stack>
            </Stack>
        </Paper>
    );
}
