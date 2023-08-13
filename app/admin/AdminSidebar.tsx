// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import type { SxProps, Theme } from '@mui/system';
import Badge from '@mui/material/Badge';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { deepmerge } from '@mui/utils';

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
 * Interface defining a manually configured divider that is to be added to the menu.
 */
interface AdminSIdebarMenuDividerEntry {
    /**
     * Set this to `true` to indicate that a divider should be added to the menu.
     */
    divider: true;
}

/**
 * Base interface for an entry to the administration sidebar interface that applies to all kinds of
 * entries, which includes rendering properties and privilege checking.
 */
interface AdminSidebarMenuEntryBase {
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
}

/**
 * Interface that defines the additional options for menu entries that act as a button, which means
 * that the user is able to immediately navigate to them.
 */
interface AdminSidebarMenuButtonEntry {
    /**
     * Optional badge that should be displayed on the menu item. Must be greater than zero.
     */
    badge?: number;

    /**
     * The URL for this list item entry. Must be absolute from the domain root.
     */
    url: string;
}

/**
 * Interface that defines the additional options for menu entries that are a parent of a sub-menu.
 * These cannot have a URL (as they are collapsable) and cannot show a badge either.
 */
interface AdminSidebarMenuParentEntry {
    /**
     * Whether the menu should be open by default. Defaults to false.
     */
    defaultOpen?: boolean;

    /**
     * Child menu items that should be shown as part of this entry.
     */
    menu: (AdminSidebarMenuEntryBase & AdminSidebarMenuButtonEntry)[];
}

/**
 * Interface that specified menu entries for the <AdminSidebar> component must adhere to.
 */
export type AdminSidebarMenuEntry =
    AdminSIdebarMenuDividerEntry |
        (AdminSidebarMenuEntryBase & (AdminSidebarMenuButtonEntry | AdminSidebarMenuParentEntry));

/**
 * Props accepted by the <RenderSidebarMenu> component.
 */
interface RenderSidebarMenuProps {
    /**
     * Whether the menu should be indented to reflect nesting.
     */
    indent?: boolean;

    /**
     * The menu entries that should be displayed as part of this sidebar. Required.
     */
    menu: AdminSidebarMenuEntry[];

    /**
     * The user for whom the menu is being shown. Included for permission checking.
     */
    user: UserData;
}

/**
 * Recursively renders the given menu, including the sub-menus that may be contained therein. While
 * this may enable deep recursive situations, TypeScript definitions should "guard" against that.
 */
function RenderSidebarMenu(props: RenderSidebarMenuProps) {
    const { indent, menu, user } = props;

    const [ collapsedState, setCollapsedState ] = useState<Set<number>>(new Set);
    const pathname = usePathname();

    function toggleCollapsedState(index: number) {
        setCollapsedState(existing => {
            existing.has(index) ? existing.delete(index)
                                : existing.add(index);

            return new Set([ ...existing ]);
        });
    }

    return (
        <List disablePadding>
            { menu.map((entry, index) => {
                if ('divider' in entry)
                    return <Divider />;

                if (entry.privilege && !can(user, entry.privilege))
                    return undefined;

                if (/* AdminSidebarMenuButtonEntry= */ 'menu' in entry) {
                    const open = collapsedState.has(index) === !entry.defaultOpen;

                    return (
                        <>
                            <ListItemButton key={index} divider={true}
                                            sx={ indent ? { pl: 5 } : undefined }
                                            onClick={ () => toggleCollapsedState(index) }>

                                { entry.icon &&
                                    <ListItemIcon sx={{ minWidth: '40px' }}>
                                        {entry.icon}
                                    </ListItemIcon> }

                                <ListItemText primaryTypographyProps={{ noWrap: true }}
                                              primary={entry.label} />

                                { open ? <ExpandLess /> : <ExpandMore /> }

                            </ListItemButton>
                            <Collapse in={open} unmountOnExit>
                                <RenderSidebarMenu indent menu={entry.menu} user={user} />
                                <Divider />
                            </Collapse>
                        </>
                    );
                }

                return (
                    <ListItemButton key={index}
                                    sx={
                                        indent ? deepmerge(kStyles.active, { pl: 5 })
                                               : kStyles.active
                                    }
                                    component={Link} href={entry.url}
                                    selected={entry.url === pathname}>

                        { entry.icon &&
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                {entry.icon}
                            </ListItemIcon> }

                        <ListItemText primaryTypographyProps={{ noWrap: true }}
                                        primary={entry.label} />

                        { (typeof entry.badge === 'number' && entry.badge > 0) &&
                            <Badge badgeContent={entry.badge} color="error" sx={{ mx: 2 }} /> }

                    </ListItemButton>
                );
            }) }
        </List>
    );

}

/**
 * Props accepted by the <AdminSidebar> component.
 */
export interface AdminSidebarProps extends RenderSidebarMenuProps {
    /**
     * Title to display at the top of the sidebar.
     */
    title: string;
}

/**
 * The <AdminSidebar> component displays a navigational menu with the configured menu items passed
 * through its props. Expected to render as a child of the <AdminContent> component.
 */
export function AdminSidebar(props: AdminSidebarProps) {
    return (
        <Paper sx={{ alignSelf: 'flex-start', flexShrink: 0, width: '280px', overflow: 'hidden' }}>
            <Typography variant="h6" sx={kStyles.header}>
                {props.title}
            </Typography>
            <RenderSidebarMenu menu={props.menu} user={props.user} />
        </Paper>
    );
}
