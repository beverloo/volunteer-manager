// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Typography from '@mui/material/Typography';

import type { RenderSidebarMenuProps } from './AdminSidebarClient';

/**
 * Props accepted by the <AdminSidebarMobileClient> component.
 */
interface AdminSidebarMobileClientProps extends RenderSidebarMenuProps {
    /**
     * Title to display at the top of the sidebar.
     */
    title: string;
}

/**
 * The <AdminSidebarMobileClient> component is a mobile variant of the administration area's regular
 * sidebar, displayed in a manner optimised for small screen devices.
 */
export function AdminSidebarMobileClient(
    props: React.PropsWithChildren<AdminSidebarMobileClientProps>)
{
    const [ menuOpen, setMenuOpen ] = useState<boolean>(false);

    const handleMenuClose = useCallback(() => setMenuOpen(false), [ /* no dependencies */ ]);
    const handleMenuOpen = useCallback(() => setMenuOpen(true), [ /* no dependencies */ ]);

    return (
        <>
            <List component="nav" disablePadding dense>
                <ListItemButton sx={{ py: 1 }} onClick={handleMenuOpen}>
                    <ListItemIcon sx={{ minWidth: '40px' }}>
                        <MenuOpenIcon sx={{ color: 'primary.contrastText' }} />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard"
                                  slotProps={{ primary: { variant: 'body1' } }} />
                </ListItemButton>
            </List>
            <Drawer anchor="bottom" open={menuOpen} onClose={handleMenuClose}>
                <Box sx={{
                    backgroundColor: 'animecon.adminHeaderBackground',
                    color: 'primary.contrastText',
                    px: 2, py: 1,
                }}>
                    <Typography variant="h6">
                        {props.title}
                    </Typography>
                </Box>
                {props.children}
            </Drawer>
        </>
    );
}
