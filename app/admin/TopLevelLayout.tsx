// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import DvrIcon from '@mui/icons-material/Dvr';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import GridViewIcon from '@mui/icons-material/GridView';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import SettingsIcon from '@mui/icons-material/Settings';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import WebhookIcon from '@mui/icons-material/Webhook';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

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
            urlMatchMode: 'strict',
        },
        {
            icon: <FeedOutlinedIcon />,
            label: 'Content',
            privilege: Privilege.SystemAdministrator,
            url: '/admin/content',
        },
        {
            icon: <TipsAndUpdatesIcon />,
            label: 'Del a Rie Advies',
            privilege: Privilege.SystemNardoAccess,
            url: '/admin/nardo',
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
            icon: <ChatBubbleOutlineIcon />,
            label: 'Communication',
            privilege: [
                Privilege.SystemOutboxAccess,
                Privilege.SystemWhatsAppAccess,
            ],

            menu: [
                {
                    icon: <MailOutlineIcon />,
                    label: 'E-mail',
                    privilege: Privilege.SystemOutboxAccess,
                    url: '/admin/system/outbox',
                },
                // TODO: Notifications
                {
                    icon: <WhatsAppIcon />,
                    label: 'WhatsApp',
                    privilege: Privilege.SystemWhatsAppAccess,
                    url: '/admin/system/whatsapp',
                }
            ],
        },
        {
            icon: <DeviceHubIcon />,
            label: 'System',
            privilege: [
                Privilege.SystemAiAccess,
                Privilege.SystemLogsAccess,
            ],

            defaultOpen: Privilege.SystemAdministrator,
            menu: [
                {
                    icon: <ModelTrainingIcon />,
                    label: 'Generative AI',
                    privilege: Privilege.SystemAiAccess,
                    url: '/admin/system/ai',
                },
                {
                    icon: <WebhookIcon />,
                    label: 'Integrations',
                    privilege: Privilege.Administrator,
                    url: '/admin/system/integrations',
                },
                {
                    icon: <DvrIcon />,
                    label: 'Logs',
                    privilege: Privilege.SystemLogsAccess,
                    url: '/admin/system/logs',
                },
                {
                    icon: <ManageHistoryIcon />,
                    label: 'Scheduler',
                    privilege: Privilege.SystemAdministrator,
                    url: '/admin/system/scheduler',
                },
                {
                    icon: <SettingsIcon />,
                    label: 'Settings',
                    privilege: Privilege.SystemAdministrator,
                    url: '/admin/system/settings',
                }
            ]
        },
    ];

    return (
        <AdminContent>
            <AdminSidebar menu={dashboardMenu} title="Dashboard" user={user} />
            <AdminPageContainer>
                {props.children}
            </AdminPageContainer>
        </AdminContent>
    );
}
