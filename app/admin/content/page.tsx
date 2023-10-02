// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { Privilege, can } from '@lib/auth/Privileges';
import { ContentCreate } from './ContentCreate';
import { ContentList } from './ContentList';
import { createGlobalScope } from './ContentScope';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ContentPage> component lists the global content, which then, in turn, may be edited and
 * deleted as applicable. This includes the privacy policy, e-mail messages, and so on.
 */
export default async function ContentPage() {
    const { user } = await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemContentAccess,
    });

    const enableAuthorLink = can(user, Privilege.VolunteerAdministrator);
    const scope = createGlobalScope();

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ pb: 1 }}>
                    Pages
                </Typography>
                <ContentList enableAuthorLink={enableAuthorLink} scope={scope} />
            </Paper>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ pb: 1 }}>
                    Create a new page
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                    You can create new <strong>global content</strong>. These pages will however not
                    automatically be published, and rely on code changes.
                </Alert>
                <ContentCreate scope={scope} />
            </Paper>
        </>
    );
}

export const metadata: Metadata = {
    title: 'Content | AnimeCon Volunteer Manager',
};
