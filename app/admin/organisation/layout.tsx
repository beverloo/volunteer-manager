// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

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
        // TODO: Accounts
        // TODO: Displays
        // TODO: Environments
        // TODO: Feedback
        // TODO: Permissions
        // TODO: Roles
        // TODO: Teams
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
