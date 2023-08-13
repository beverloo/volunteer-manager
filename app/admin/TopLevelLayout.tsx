// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import DvrIcon from '@mui/icons-material/Dvr';
import GridViewIcon from '@mui/icons-material/GridView';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';

import { AdminContent } from './AdminContent';
import { AdminPageContainer } from './AdminPageContainer';
import { type AdminSidebarMenuEntry, AdminSidebar } from './AdminSidebar';
import { Privilege } from '@app/lib/auth/Privileges';
import { requireUser } from '../lib/auth/getUser';

export default async function TopLevelLayout(props: React.PropsWithChildren) {
    const user = await requireUser();

    const dashboardMenu: AdminSidebarMenuEntry[] = [
        {
            icon: <GridViewIcon />,
            label: 'Dashboard',
            url: '/admin',
        },
        {
            icon: <DvrIcon />,
            label: 'Logs',
            privilege: Privilege.SystemAdministrator,
            url: '/admin/logs',
        },
        {
            icon: <ManageHistoryIcon />,
            label: 'Services',
            privilege: Privilege.SystemAdministrator,
            url: '/admin/services',
        }
    ];

    return (
        <AdminContent>
            <AdminSidebar menu={dashboardMenu} title="Dashboard" user={user.toUserData()} />
            <AdminPageContainer>
                {props.children}
            </AdminPageContainer>
        </AdminContent>
    );
}
