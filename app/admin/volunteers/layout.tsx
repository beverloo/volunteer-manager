// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import GroupsIcon from '@mui/icons-material/Groups';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import PersonIcon from '@mui/icons-material/Person';

import { AdminContent } from '../AdminContent';
import { AdminPageContainer } from '../AdminPageContainer';
import { type AdminSidebarMenuEntry, AdminSidebar } from '../AdminSidebar';
import { Privilege, can } from '@lib/auth/Privileges';
import { requireUser } from '@lib/auth/getUser';

/**
 * Layout of the administration section of the Volunteer Manager. The layout is the same for every
 * (signed in) user, although the available options will depend on the user's access level.
 */
export default async function VolunteersLayout(props: React.PropsWithChildren) {
    const user = await requireUser();

    if (!can(user, Privilege.VolunteerAdministrator))
        notFound();

    const volunteersMenu: AdminSidebarMenuEntry[] = [
        {
            icon: <ImportExportIcon />,
            label: 'Data exports',
            privilege: Privilege.Administrator,
            url: '/admin/volunteers/exports',
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
            <AdminSidebar menu={volunteersMenu} title="Volunteers" user={user.toUserData()} />
            <AdminPageContainer>
                {props.children}
            </AdminPageContainer>
        </AdminContent>
    )
}
