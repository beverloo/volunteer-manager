// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <TeamPage> component shows to the volunteer information about one very specific team, as has
 * been indicated in the URL's parameters. The team's settings can be updated from here too.
 */
export default async function TeamPage(props: NextPageParams<'id'>) {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.teams',
    });

    const params = await props.params;

    return (
        <Typography>
            TODO (Team: {params.id})
        </Typography>
    );
}

export const generateMetadata = createGenerateMetadataFn({ team: 'id' }, 'Teams', 'Organisation');
