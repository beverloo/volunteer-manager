// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { forbidden } from 'next/navigation';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import GroupsIcon from '@mui/icons-material/Groups';
import Paper from '@mui/material/Paper';
import PublicIcon from '@mui/icons-material/Public';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';

import { NavigationTabs, type NavigationTabsProps } from '@app/admin/components/NavigationTabs';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { requireAuthenticationContext, or } from '@lib/auth/AuthenticationContext';

/**
 * The <OrganisationEntitiesLayout> is the core page that gives the user access to the environments,
 * roles and teams that exist as part of the Volunteer Manager. Each is guarded behind a separate
 * permission, and will be displayed in a tabbed manner.
 */
export default async function OrganisationEntitiesLayout(props: React.PropsWithChildren) {
    const { access } = await requireAuthenticationContext({
        check: 'admin',
        permission: or(
            'organisation.environments',
            'organisation.roles',
            'organisation.teams',
        ),
    });

    // ---------------------------------------------------------------------------------------------
    // Determine the tabs that the signed in user has access to
    // ---------------------------------------------------------------------------------------------

    const tabs: NavigationTabsProps['tabs'] = [];
    if (access.can('organisation.environments')) {
        tabs.push({
            icon: <PublicIcon />,
            label: 'Environments',
            url: '/admin/organisation/teams/environments',
            urlMatchMode: 'prefix',
        });
    }

    if (access.can('organisation.roles')) {
        tabs.push({
            icon: <WorkOutlineIcon />,
            label: 'Roles',
            url: '/admin/organisation/teams/roles',
        });
    }

    if (access.can('organisation.teams')) {
        tabs.push({
            icon: <GroupsIcon />,
            label: 'Teams',
            url: '/admin/organisation/teams',
            urlMatchMode: 'prefix',
        });
    }

    if (!tabs.length)
        forbidden();

    // ---------------------------------------------------------------------------------------------

    return (
        <>
            <Section icon={ <GroupsIcon color="primary" /> } title="Teams" subtitle="entities"
                     documentation="teams">
                <SectionIntroduction>
                    Our organisation consists of <strong>environments</strong>,{' '}
                    <strong>roles</strong> and <strong>teams</strong>. This page allows you to
                    create and manage these entities.
                </SectionIntroduction>
            </Section>
            <Paper>
                <NavigationTabs tabs={tabs} />
                <Divider />
                <Box sx={{ p: 2 }}>
                    {props.children}
                </Box>
            </Paper>
        </>
    );
}
