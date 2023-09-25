// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import DvrIcon from '@mui/icons-material/Dvr';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import GridViewIcon from '@mui/icons-material/GridView';
import MailIcon from '@mui/icons-material/Mail';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import WebhookIcon from '@mui/icons-material/Webhook';

import { AdminContent } from './AdminContent';
import { AdminPageContainer } from './AdminPageContainer';
import { type AdminSidebarMenuEntry, AdminSidebar } from './AdminSidebar';
import { Privilege } from '@lib/auth/Privileges';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

export default async function TopLevelLayout(props: React.PropsWithChildren) {
    const { user } = await requireAuthenticationContext();

    const dashboardMenu: AdminSidebarMenuEntry[] = [
        {
            icon: <GridViewIcon />,
            label: 'Dashboard',
            url: '/admin',
        },
        {
            icon: <FeedOutlinedIcon />,
            label: 'Content',
            privilege: Privilege.SystemAdministrator,
            url: '/admin/content',
        },
        {
            icon: <EventNoteIcon />,
            label: 'Events',
            privilege: Privilege.EventAdministrator,
            url: '/admin/events',
        },
        {
            divider: true,
            privilege: [ Privilege.SystemAdministrator, Privilege.SystemLogsAccess ],
        },
        {
            icon: <DeviceHubIcon />,
            label: 'System',
            privilege: [
                Privilege.SystemAdministrator,
                Privilege.SystemLogsAccess,
                Privilege.SystemOutboxAccess,
            ],

            defaultOpen: Privilege.SystemAdministrator,
            menu: [
                {
                    icon: <WebhookIcon />,
                    label: 'Integrations',
                    privilege: Privilege.SystemAdministrator,
                    url: '/admin/integrations',
                },
                {
                    icon: <DvrIcon />,
                    label: 'Logs',
                    privilege: Privilege.SystemLogsAccess,
                    url: '/admin/logs',
                },
                {
                    icon: <MailIcon />,
                    label: 'Outbox',
                    privilege: Privilege.SystemOutboxAccess,
                    url: '/admin/outbox',
                },
                {
                    icon: <ManageHistoryIcon />,
                    label: 'Services',
                    privilege: Privilege.SystemAdministrator,
                    url: '/admin/services',
                }
            ]
        },
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
