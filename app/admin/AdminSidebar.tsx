// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { SxProps, Theme } from '@mui/system';
import Badge from '@mui/material/Badge';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { UserData } from '@app/lib/auth/UserData';
import { type Privilege, can } from '@app/lib/auth/Privileges';

/**
 * Custom styles applied to the <AdminSidebar> & related components.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    active: {
        '&.Mui-selected': {
            color: 'secondary.dark',
        },
        '&.Mui-selected .MuiSvgIcon-root': {
            color: 'secondary.dark',
        },
    },
    header: {
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        paddingX: 2,
        paddingY: 1,
    },
};

/**
 * Interface that specified menu entries for the <AdminSidebar> component must adhere to.
 */
export interface AdminSidebarMenuEntry {
    /**
     * Optional badge that should be displayed on the menu item.
     */
    badge?: number;

    /**
     * The icon that should be displayed with the menu entry. Optional.
     */
    icon?: React.ReactNode;

    /**
     * The label that should be displayed with the menu entry.
     */
    label: string;

    /**
     * The privilege this entry is gated behind. Visibility control, not an access control.
     */
    privilege?: Privilege;

    /**
     * The URL for this list item entry. Must be absolute from the domain root.
     */
    url: string;
}

/**
 * Props accepted by the <AdminSidebar> component.
 */
export interface AdminSidebarProps {
    /**
     * The menu entries that should be displayed as part of this sidebar. Required.
     */
    menu: AdminSidebarMenuEntry[];

    /**
     * Title to display at the top of the sidebar.
     */
    title: string;

    /**
     * The user for whom the menu is being shown. Included for permission checking.
     */
    user: UserData;
}

/**
 * The <AdminSidebar> component displays a navigational menu with the configured menu items passed
 * through its props. Expected to render as a child of the <AdminContent> component.
 */
export function AdminSidebar(props: AdminSidebarProps) {
    const { menu, title, user } = props;

    const pathname = usePathname();

    return (
        <Paper sx={{ alignSelf: 'flex-start', width: '280px', overflow: 'hidden' }}>
            <Typography variant="h6" sx={kStyles.header}>
                {title}
            </Typography>
            <List disablePadding>
                { menu.map((entry, index) => {
                    if (entry.privilege && !can(user, entry.privilege))
                        return undefined;

                    return (
                        <ListItemButton key={index} sx={kStyles.active}
                                        component={Link} href={entry.url}
                                        selected={entry.url === pathname}>
                            { entry.icon &&
                                <ListItemIcon sx={{ minWidth: '40px' }}>
                                    {entry.icon}
                                </ListItemIcon> }
                            <ListItemText primaryTypographyProps={{ noWrap: true }}
                                          primary={entry.label} />
                            { entry.badge &&
                                <Badge badgeContent={25} color="error" sx={{ ml: 3, mr: 2 }} /> }
                        </ListItemButton>
                    );
                }) }
            </List>
        </Paper>
    );
}
