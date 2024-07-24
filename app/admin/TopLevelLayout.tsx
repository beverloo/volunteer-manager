// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import ApiIcon from '@mui/icons-material/Api';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import DvrIcon from '@mui/icons-material/Dvr';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import ForumIcon from '@mui/icons-material/Forum';
import GridViewIcon from '@mui/icons-material/GridView';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import OutboxIcon from '@mui/icons-material/Outbox';
import SettingsIcon from '@mui/icons-material/Settings';
import TabletIcon from '@mui/icons-material/Tablet';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import WebhookIcon from '@mui/icons-material/Webhook';

import { AdminContent } from './AdminContent';
import { AdminPageContainer } from './AdminPageContainer';
import { type AdminSidebarMenuEntry, AdminSidebar } from './AdminSidebar';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

import { kAnyEvent, kAnyTeam } from '@lib/auth/AccessControl';

export default async function TopLevelLayout(props: React.PropsWithChildren) {
    const { access } = await requireAuthenticationContext();

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
            permission: 'system.content',
            url: '/admin/content',
        },
        {
            icon: <TipsAndUpdatesIcon />,
            label: 'Del a Rie Advies',
            permission: 'system.nardo',
            url: '/admin/nardo',
        },
        {
            icon: <EventNoteIcon />,
            label: 'Events',
            permission: {
                permission: 'event.visible',
                options: {
                    event: kAnyEvent,
                    team: kAnyTeam,
                },
            },
            url: '/admin/events',
        },
        {
            divider: true,
            permission: [
                'system.internals.ai',
                'system.internals.outbox',
                'system.subscriptions.management',
            ],
        },
        {
            icon: <ChatBubbleOutlineIcon />,
            label: 'Communication',
            permission: [
                'system.feedback',
                'system.internals',
                'system.internals.outbox',
                'system.subscriptions.management',
            ],
            menu: [
                {
                    icon: <FeedbackOutlinedIcon />,
                    label: 'Feedback',
                    permission: 'system.feedback',
                    url: '/admin/system/feedback',
                },
                {
                    icon: <OutboxIcon />,
                    label: 'Outbox',
                    permission: 'system.internals.outbox',
                    url: '/admin/system/outbox/email',
                },
                {
                    icon: <ForumIcon />,
                    label: 'Subscriptions',
                    permission: 'system.subscriptions.management',
                    url: '/admin/system/subscriptions',
                },
                {
                    icon: <WebhookIcon />,
                    label: 'Webhooks',
                    permission: 'system.internals',
                    url: '/admin/system/webhooks',
                },
            ],
        },
        {
            icon: <DeviceHubIcon />,
            label: 'System',
            permission: [
                'system.displays',
                'system.internals.ai',
                'system.internals.scheduler',
                'system.internals.settings',
                { permission: 'system.logs', operation: 'read' },
            ],
            defaultOpen: access.can('system.internals'),
            menu: [
                {
                    icon: <TabletIcon />,
                    label: 'Displays',
                    permission: 'system.displays',
                    url: '/admin/system/displays',
                },
                {
                    icon: <ModelTrainingIcon />,
                    label: 'Generative AI',
                    permission: 'system.internals.ai',
                    url: '/admin/system/ai',
                },
                {
                    icon: <ApiIcon />,
                    label: 'Integrations',
                    permission: 'system.internals.settings',
                    url: '/admin/system/integrations',
                },
                {
                    icon: <DvrIcon />,
                    label: 'Logs',
                    permission: {
                        permission: 'system.logs',
                        operation: 'read',
                    },
                    url: '/admin/system/logs',
                },
                {
                    icon: <ManageHistoryIcon />,
                    label: 'Scheduler',
                    permission: 'system.internals.scheduler',
                    url: '/admin/system/scheduler',
                },
                {
                    icon: <SettingsIcon />,
                    label: 'Settings',
                    permission: 'system.internals.settings',
                    url: '/admin/system/settings',
                }
            ]
        },
    ];

    return (
        <AdminContent>
            <AdminSidebar access={access} menu={dashboardMenu} title="Dashboard" />
            <AdminPageContainer>
                {props.children}
            </AdminPageContainer>
        </AdminContent>
    );
}
