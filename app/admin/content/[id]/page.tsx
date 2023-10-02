// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { ContentEditor } from '@app/admin/content/ContentEditor';
import { Privilege } from '@lib/auth/Privileges';
import { createGlobalScope } from '@app/admin/content/ContentScope';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ContentEntryPage> page displays an individual piece of content that can be edited by
 * the volunteer. The <ContentEditor> component takes care of the actual behaviour.
 */
export default async function ContentEntryPage(props: NextRouterParams<'id'>) {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemContentAccess,
    });

    const scope = createGlobalScope();

    return (
        <ContentEditor contentId={parseInt(props.params.id)} scope={scope}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Page editor
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                You are updating <strong>global content</strong>, any changes you save will be
                published immediately.
            </Alert>
        </ContentEditor>
    );
}

export const metadata: Metadata = {
    title: 'Content | AnimeCon Volunteer Manager',
};
