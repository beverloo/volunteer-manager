// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { AdminSidebarMenuEntry, RenderSidebarMenuProps } from './AdminSidebarClient';
import type { BooleanPermission, CRUDPermission } from '@lib/auth/Access';
import type { AccessControl } from '@lib/auth/AccessControl';
import type { User } from '@lib/auth/User';
import { RenderSidebarClient } from './AdminSidebarClient';
import { can } from '@lib/auth/Privileges';

/**
 * Re-export the types from the client file.
 */
export type { AdminSidebarMenuEntry, AdminSidebarMenuSubMenuItem } from './AdminSidebarClient';

/**
 * Custom styles applied to the <AdminSidebar> & related components.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    header: {
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        paddingX: 2,
        paddingY: 1,
    },
};

/**
 * Filters the `menu` options based on permissions defined within the structure. When a permission
 * has not been granted, the menu options will be omitted instead.
 */
function filterMenuOptions(inputMenu: AdminSidebarMenuEntry[], access: AccessControl, user: User) {
    const menu: AdminSidebarMenuEntry[] = [];
    for (const entry of inputMenu) {
        if (typeof entry.condition === 'boolean' && !entry.condition)
            continue;  // unmet condition

        if (entry.permission) {
            const permissions =
                Array.isArray(entry.permission) ? entry.permission : [ entry.permission ];

            for (const sidebarPermission of permissions) {
                const options = sidebarPermission.options;

                if ('operation' in sidebarPermission) {
                    const permission = sidebarPermission.permission as CRUDPermission;
                    if (!access.can(permission, sidebarPermission.operation, options))
                        continue;  // permission has not been granted

                } else {
                    const permission = sidebarPermission.permission as BooleanPermission;
                    if (!access.can(permission, options))
                        continue;  // permission has not been granted
                }
            }
        }

        if (entry.privilege) {
            const privileges =
                Array.isArray(entry.privilege) ? entry.privilege : [ entry.privilege ];

            for (const privilege of privileges) {
                if (!can(user, privilege))
                    continue;  // privilege has not been granted
            }
        }

        if ('menu' in entry)
            entry.menu = filterMenuOptions(entry.menu, access, user) as any;

        menu.push(entry);
    }

    return menu;
}

/**
 * Props accepted by the <AdminSidebar> component.
 */
interface AdminSidebarProps extends RenderSidebarMenuProps {
    /**
     * Access control applicable for the signed in user.
     */
    access: AccessControl;

    /**
     * Title to display at the top of the sidebar.
     */
    title: string;

    /**
     * The user for whom the menu is being shown. Included for permission checking.
     */
    user: User;
}

/**
 * The <AdminSidebar> component displays a navigational menu with the configured menu items passed
 * through its props. Expected to render as a child of the <AdminContent> component.
 */
export function AdminSidebar(props: AdminSidebarProps) {
    const menu = filterMenuOptions(props.menu, props.access, props.user);
    return (
        <Paper sx={{ alignSelf: 'flex-start', flexShrink: 0, width: '280px', overflow: 'hidden' }}>
            <Typography variant="h6" sx={kStyles.header}>
                {props.title}
            </Typography>
            <RenderSidebarClient menu={menu} />
        </Paper>
    );
}
