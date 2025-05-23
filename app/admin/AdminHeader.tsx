// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
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

import type { User } from '@lib/auth/User';
import { Avatar } from '@components/Avatar';

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
 * Interface definition for events that should be shown in the administrative header.
 */
export interface AdminHeaderEventEntry {
    /**
     * Whether the event is in the past.
     */
    done: boolean;

    /**
     * Name of the event as it should be displayed in the menu item.
     */
    label: string;

    /**
     * Unique slug that identifies the event in URLs.
     */
    slug: string;
}

/**
 * Props accepted by the <AdminHeader> component.
 */
interface AdminHeaderProps {
    /**
     * The events to display in the header, if any.
     */
    events: AdminHeaderEventEntry[];

    /**
     * Whether the signed in volunteer has access to the organisation section.
     */
    canAccessOrganisationSection: boolean;

    /**
     * Whether the signed in volunteer has access to the volunteers section.
     */
    canAccessVolunteersSection: boolean;

    /**
     * The user who is currently viewing the administration area.
     */
    user: User;
}

/**
 * The <AdminHeader> component displays a bar at the top of the screen for the administration
 * environment, that shows the available sub-sections. Global to the admin environment.
 */
export function AdminHeader(props: AdminHeaderProps) {
    const { events, user } = props;

    const [ anchorElement, setAnchorElement ] = useState<HTMLElement | null>(/* closed= */ null);

    function requestMenuOpen(event: React.MouseEvent<HTMLElement>) {
        setAnchorElement(event.currentTarget);
    }

    function requestMenuClose() {
        setAnchorElement(/* closed= */ null);
    }

    return (
        <Paper>
            <Stack direction="row" justifyContent="space-between" alignItems="center"
                spacing={2} sx={kStyles.container}>

                <Typography color="primary.contrastText" variant="h6">
                    AnimeCon Volunteer Manager
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography color="primary.contrastText">
                        { user.displayName ?? user.firstName }
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
                        <MenuItem key={index} component={Link} href={`/admin/events/${event.slug}`}
                                  onClick={requestMenuClose}>
                            <ListItemIcon>
                                { event.done && <TaskAltIcon color="disabled" fontSize="small" /> }
                                { !event.done &&
                                    <PlayCircleOutlineIcon color="success" fontSize="small" /> }
                            </ListItemIcon>
                            <ListItemText>
                                {event.label}
                            </ListItemText>
                        </MenuItem> )}

                    <Divider />

                    <MenuItem component={Link} href="/admin/events" onClick={requestMenuClose}>
                        <ListItemIcon>
                            <SettingsIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>
                            Manage events
                        </ListItemText>
                    </MenuItem>

                </Menu>

                { props.canAccessOrganisationSection &&
                    <Button component={Link} href="/admin/organisation" variant="text"
                            color="inherit">
                        Organisation
                    </Button>}

                { props.canAccessVolunteersSection &&
                    <Button component={Link} href="/admin/volunteers" variant="text"
                            color="inherit">
                        Stuff that needs to move
                    </Button> }
            </Stack>
            <Divider />
        </Paper>
    );
}
