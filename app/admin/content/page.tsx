// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { Privilege, can } from '@lib/auth/Privileges';
import { ContentList } from './ContentList';
import { createGlobalScope } from './ContentScope';
import { requireUser } from '@lib/auth/getUser';

/**
 * The <ContentPage> component lists the global content, which then, in turn, may be edited and
 * deleted as applicable. This includes the privacy policy, e-mail messages, and so on.
 */
export default async function ContentPage() {
    const user = await requireUser();
    if (!can(user, Privilege.SystemContentAccess))
        notFound();

    const enableAuthorLink = can(user, Privilege.VolunteerAdministrator);
    const scope = createGlobalScope();

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Content
            </Typography>
            <ContentList enableAuthorLink={enableAuthorLink} scope={scope} />
        </Paper>
    );
}

export const metadata: Metadata = {
    title: 'Content',
};
