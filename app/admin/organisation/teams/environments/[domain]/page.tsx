// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <EnvironmentPage> component shows to the volunteer information about a specific environment
 * they would like to inspect or update.
 */
export default async function EnvironmentPage(props: NextPageParams<'domain'>) {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.environments',
    });

    const params = await props.params;

    return (
        <Typography>
            TODO (Environment: {params.domain})
        </Typography>
    );
}

export const generateMetadata =
    createGenerateMetadataFn({ environment: 'domain' }, 'Environments', 'Organisation');
