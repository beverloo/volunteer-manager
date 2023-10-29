// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

/**
 * Props accepted by the <DashboardNavigation> component.
 */
interface DashboardNavigationProps {
    /**
     * The list of events that can be presented to the current user.
     */
    events: { slug: string; label: string; }[];
}

/**
 * The <DashboardNavigation> component is displayed at the top of the dashboard and provides the
 * user with the ability to navigate back and forth between different displays. It hooks in to the
 * router to figure out what to display as the active page.
 */
export function DashboardNavigation(props: DashboardNavigationProps) {
    const router = useRouter();

    const [ anchorEl, setAnchorEl ] = useState<HTMLElement | undefined>();

    const closeEventMenu = useCallback(() => setAnchorEl(undefined), [ /* no dependencies */ ]);
    const openEventMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, [ /* no dependencies */ ]);

    return (
        <Paper elevation={2} sx={{ p: { xs: 0, md: 1 } }}>
            <Stack direction="row" spacing={2}>
                <Button onClick={ () => router.push('/statistics') }>
                    Dashboard
                </Button>
                { props.events.length === 1 &&
                    <Button onClick={ () => router.push(`/statistics/${props.events[0].slug}`) }>
                        {props.events[0].label}
                    </Button> }
                { props.events.length > 1 &&
                    <>
                        <Button onClick={openEventMenu} endIcon={ <ExpandMoreIcon /> }>
                            Events
                        </Button>
                        <Menu anchorEl={anchorEl} open={!!anchorEl} onClick={closeEventMenu}>
                            { props.events.map(({ slug, label }) =>
                                <MenuItem onClick={ () => router.push(`/statistics/${slug}`) }
                                          key={slug}>
                                    {label}
                                </MenuItem> )}
                        </Menu>
                    </> }
            </Stack>
        </Paper>
    );
}
