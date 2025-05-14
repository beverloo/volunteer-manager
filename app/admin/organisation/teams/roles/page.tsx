// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <RolesPage> component enables the volunteer to adjust the roles that are available on the
 * Volunteer Manager. Roles define what function people exercise within our organisation.
 */
export default async function RolesPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.roles',
    });

    return (
        <Typography>
            TODO (Roles)
        </Typography>
    );
}

export const generateMetadata = createGenerateMetadataFn('Roles', 'Organisation');
