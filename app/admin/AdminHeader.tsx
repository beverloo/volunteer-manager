// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { SxProps, Theme } from '@mui/system';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Paper from '@mui/material/Paper';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import Stack from '@mui/material/Stack';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Typography from '@mui/material/Typography';

import type { UserData } from '@app/lib/auth/UserData';
import { Avatar } from '@app/components/Avatar';
import { Privilege, can } from '@app/lib/auth/Privileges';

/**
 * Custom styles applied to the <AdminHeader> & related components.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    container: {
        backgroundColor: 'primary.main',
        borderTopLeftRadius: theme => `${theme.shape.borderRadius}px`,
        borderTopRightRadius: theme => `${theme.shape.borderRadius}px`,
        paddingX: 2,
        paddingY: 1,
    },
};

/**
 * Props accepted by the <AdminHeader> component.
 */
export interface AdminHeaderProps {
    /**
     * The user who is currently viewing the administration area.
     */
    user: UserData;
}

/**
 * The <AdminHeader> component displays a bar at the top of the screen for the administration
 * environment, that shows the available sub-sections. Global to the admin environment.
 */
export function AdminHeader(props: AdminHeaderProps) {
    const { user } = props;

    const [ anchorElement, setAnchorElement ] = useState<HTMLElement | null>(/* closed= */ null);

    function requestMenuOpen(event: React.MouseEvent<HTMLElement>) {
        setAnchorElement(event.currentTarget);
    }

    function requestMenuClose() {
        setAnchorElement(/* closed= */ null);
    }

    // TODO: Select appropriate events for the `user` from the database, and pass them in to the
    // <AdminHeader> component as a prop.
    const events = [
        { label: 'AnimeCon 2024', done: false, url: '/admin/events/2024' },
        { label: 'AnimeCon 2023', done: true, url: '/admin/events/2023' },
        { label: 'AnimeCon 2022: Classic', done: true, url: '/admin/events/2022-classic' },
        { label: 'AnimeCon 2022', done: true, url: '/admin/events/2022' },
    ];

    return (
        <Paper>
            <Stack direction="row" justifyContent="space-between" alignItems="center"
                spacing={2} sx={kStyles.container}>

                <Typography color="primary.contrastText" variant="h6">
                    AnimeCon Volunteer Manager
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography color="primary.contrastText">
                        {user.firstName}
                    </Typography>
                    <Avatar src={user.avatarUrl}>
                        {user.firstName} {user.lastName}
                    </Avatar>
                </Stack>

            </Stack>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 1 }}>
                <Button component={Link} href="/admin" variant="text" color="inherit">
                    Dashboard
                </Button>

                <Button endIcon={ <ExpandMoreIcon /> } variant="text" color="inherit"
                        onClick={requestMenuOpen}>
                    Events
                </Button>

                <Menu anchorEl={anchorElement} variant="menu"
                      open={!!anchorElement}
                      onClose={requestMenuClose}>

                    { events.map((event, index) =>
                        <MenuItem key={index} component={Link} href={event.url}>
                            <ListItemIcon>
                                { event.done && <TaskAltIcon color="disabled" fontSize="small" /> }
                                { !event.done &&
                                    <PlayCircleOutlineIcon color="success" fontSize="small" /> }
                            </ListItemIcon>
                            <ListItemText>
                                {event.label}
                            </ListItemText>
                        </MenuItem> )}

                    { can(user, Privilege.Administrator) && <Divider /> }
                    { can(user, Privilege.Administrator) &&
                        <MenuItem component={Link} href="/admin/events">
                            <ListItemIcon>
                                <SettingsIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>
                                Manage events
                            </ListItemText>
                        </MenuItem> }

                </Menu>

                <Button component={Link} href="/admin/volunteers" variant="text" color="inherit">
                    Volunteers
                </Button>
            </Stack>
            <Divider />
        </Paper>
    );
}
