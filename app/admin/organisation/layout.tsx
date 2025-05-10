// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import CategoryIcon from '@mui/icons-material/Category';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import TabletIcon from '@mui/icons-material/Tablet';

import { type AdminSidebarMenuEntry, AdminSidebar } from '../AdminSidebar';
import { AdminContent } from '../AdminContent';
import { AdminPageContainer } from '../AdminPageContainer';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

import { kDashboardPermissions } from './dashboard/DashboardPermissions';

/**
 * Layout of organisation management within the AnimeCon Volunteer Manager. Our organisation exists
 * of people, roles and teams, each of which have information, permission and settings associated
 * with them. This area follows our canonical structure of a sidebar with page content.
 */
export default async function OrganisationLayout(props: React.PropsWithChildren) {
    const { access } = await requireAuthenticationContext({
        check: 'admin',
        permission: kDashboardPermissions,
    });

    const organisationMenu: AdminSidebarMenuEntry[] = [
        {
            icon: <PersonIcon />,
            label: 'Accounts',
            permission: 'organisation.accounts',
            url: '/admin/organisation/accounts',
        },
        {
            icon: <TabletIcon />,
            label: 'Displays',
            permission: 'organisation.displays',
            url: '/admin/organisation/displays',
        },
        // TODO: Environments
        {
            icon: <FeedbackOutlinedIcon />,
            label: 'Feedback',
            permission: 'organisation.feedback',
            url: '/admin/organisation/feedback',
        },
        {
            icon: <CategoryIcon />,
            label: 'Permissions',
            permission: {
                permission: 'organisation.permissions',
                operation: 'read',
            },
            url: '/admin/organisation/permissions',
        },
        {
            icon: <GroupsIcon />,
            label: 'Teams & roles',
            permission: 'organisation.teams',
            url: '/admin/organisation/teams',
        },
    ];

    return (
        <AdminContent>
            <AdminSidebar access={access} menu={organisationMenu} title="Organisation" />
            <AdminPageContainer>
                {props.children}
            </AdminPageContainer>
        </AdminContent>
    );
}
