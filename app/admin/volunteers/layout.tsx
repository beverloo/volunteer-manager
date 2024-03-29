// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import ShareIcon from '@mui/icons-material/Share';
import WorkspacesIcon from '@mui/icons-material/Workspaces';

import { type AdminSidebarMenuEntry, AdminSidebar } from '../AdminSidebar';
import { AdminContent } from '../AdminContent';
import { AdminPageContainer } from '../AdminPageContainer';
import { Privilege } from '@lib/auth/Privileges';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * Layout of the administration section of the Volunteer Manager. The layout is the same for every
 * (signed in) user, although the available options will depend on the user's access level.
 */
export default async function VolunteersLayout(props: React.PropsWithChildren) {
    const { user } = await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.VolunteerAdministrator,
    });

    const volunteersMenu: AdminSidebarMenuEntry[] = [
        {
            icon: <ShareIcon />,
            label: 'Exports',
            privilege: Privilege.VolunteerDataExports,
            url: '/admin/volunteers/exports',
        },
        {
            icon: <WorkspacesIcon />,
            label: 'Shift categories',
            privilege: Privilege.Administrator,
            url: '/admin/volunteers/shifts',
        },
        {
            icon: <GroupsIcon />,
            label: 'Teams & roles',
            privilege: Privilege.Administrator,
            url: '/admin/volunteers/teams',
        },
        {
            icon: <PersonIcon />,
            label: 'Volunteers',
            url: '/admin/volunteers',
        },
    ];

    return (
        <AdminContent>
            <AdminSidebar menu={volunteersMenu} title="Volunteers" user={user} />
            <AdminPageContainer>
                {props.children}
            </AdminPageContainer>
        </AdminContent>
    )
}
