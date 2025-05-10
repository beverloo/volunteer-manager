// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import CategoryIcon from '@mui/icons-material/Category';
import DvrIcon from '@mui/icons-material/Dvr';
import EventNoteIcon from '@mui/icons-material/EventNote';
import Paper from '@mui/material/Paper';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';

import type { NextLayoutParams } from '@lib/NextRouterParams';
import { AccountHeaderActions } from './AccountHeaderActions';
import { AccountNavigation, type AccountNavigationProps } from './AccountNavigation';
import { Section } from '@app/admin/components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tUsers } from '@lib/database';

/**
 * The <AccountLayout> component contains the layout surrounding the account page. The page is built
 * up of one or more tabs, each of which provides access to a separate section of account details.
 */
export default async function AccountLayout(
    props: React.PropsWithChildren<NextLayoutParams<'id'>>)
{
    const { access } = await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.accounts',
    });

    // ---------------------------------------------------------------------------------------------
    // Fetch information about this user from the database:
    // ---------------------------------------------------------------------------------------------

    const id = parseInt((await props.params).id, /* radix= */ 10);
    if (!Number.isSafeInteger(id))
        notFound();

    const account = await db.selectFrom(tUsers)
        .where(tUsers.userId.equals(id))
        .select({
            id: tUsers.userId,
            name: tUsers.name,
        })
        .executeSelectNoneOrOne();

    if (!account)
        notFound();

    // ---------------------------------------------------------------------------------------------
    // Determine the pages that the signed in user has access to:
    // ---------------------------------------------------------------------------------------------

    const pages: AccountNavigationProps['pages'] = [
        {
            icon: <PersonIcon />,
            label: 'Information',
            url: `/admin/organisation/accounts/${account.id}`,
        },
        {
            icon: <EventNoteIcon />,
            label: 'Participation',
            url: `/admin/organisation/accounts/${account.id}/participation`,
        }
    ];

    if (access.can('system.logs', 'read')) {
        pages.push({
            icon: <DvrIcon />,
            label: 'Logs',
            url: `/admin/organisation/accounts/${account.id}/logs`,
        });
    }

    if (access.can('organisation.permissions', 'read')) {
        pages.push({
            icon: <CategoryIcon />,
            label: 'Permissions',
            url: `/admin/organisation/accounts/${account.id}/permissions`,
        });
    }

    pages.push({
        icon: <SettingsIcon />,
        label: 'Settings',
        url: `/admin/organisation/accounts/${account.id}/settings`,
    });

    // ---------------------------------------------------------------------------------------------

    return (
        <>
            <Section title={account.name}>
                <AccountHeaderActions />
            </Section>
            <Paper>
                <AccountNavigation pages={pages} />
                <Box sx={{ p: 2 }}>
                    {props.children}
                </Box>
            </Paper>
        </>
    );
}
