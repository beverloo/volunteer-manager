// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import ShareIcon from '@mui/icons-material/Share';
import WorkspacesIcon from '@mui/icons-material/Workspaces';

import { type AdminSidebarMenuEntry, AdminSidebar } from '../AdminSidebar';
import { AdminContent } from '../AdminContent';
import { AdminPageContainer } from '../AdminPageContainer';
import { or, requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * Layout of the administration section of the Volunteer Manager. The layout is the same for every
 * (signed in) user, although the available options will depend on the user's access level.
 */
export default async function VolunteersLayout(props: React.PropsWithChildren) {
    // Note: keep this in sync with //admin/layout.tsx
    const { access } = await requireAuthenticationContext({
        check: 'admin',
        permission: or(
            'volunteer.export',
            'volunteer.settings.shifts',
            'volunteer.settings.teams',
            {
                permission: 'volunteer.account.information',
                operation: 'read',
            }),
    });

    const volunteersMenu: AdminSidebarMenuEntry[] = [
        {
            icon: <ShareIcon />,
            label: 'Exports',
            permission: 'volunteer.export',
            url: '/admin/volunteers/exports',
        },
        {
            icon: <WorkspacesIcon />,
            label: 'Shift categories',
            permission: 'volunteer.settings.shifts',
            url: '/admin/volunteers/shifts',
        },
        {
            icon: <GroupsIcon />,
            label: 'Teams & roles',
            permission: 'volunteer.settings.teams',
            url: '/admin/volunteers/teams',
        },
        {
            icon: <PersonIcon />,
            label: 'Volunteers',
            permission: {
                permission: 'volunteer.account.information',
                operation: 'read',
            },
            url: '/admin/volunteers',
        },
    ];

    return (
        <AdminContent>
            <AdminSidebar access={access} menu={volunteersMenu} title="Volunteers" />
            <AdminPageContainer>
                {props.children}
            </AdminPageContainer>
        </AdminContent>
    )
}
