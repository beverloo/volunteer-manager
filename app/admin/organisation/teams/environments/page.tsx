// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <EnvironmentsPage> component enables the volunteer to adjust the environments that exist on
 * the Volunteer Manager. These are the individual landing pages through which the system can be
 * reached, each having its own lightweight personalisation.
 */
export default async function EnvironmentsPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.environments',
    });

    return (
        <Typography>
            TODO (Environments)
        </Typography>
    );
}

export const generateMetadata = createGenerateMetadataFn('Environments', 'Organisation');
