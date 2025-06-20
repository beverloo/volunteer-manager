// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { ExportsDataTable } from './ExportsDataTable';
import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <OrganisationExportsLogsPage> component displays a data table with all exports lots that
 * have ever been created on the Volunteering Manager. They can be clicked through to see more info
 * on what was exported by who, and when it was accessed.
 */
export default async function OrganisationExportsPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.exports'
    });

    return <ExportsDataTable />;
}

export const generateMetadata = createGenerateMetadataFn('Exports', 'Organisation');
