// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { HelpRequestTable } from './HelpRequestTable';
import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <DisplaysPage> component hosts a data table that shows the physical displays that have
 * recently checked in, and allows them to be provisioned and configured.
 */
export default async function HelpRequestsPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.displays',
    });

    return <HelpRequestTable />;
}

export const generateMetadata = createGenerateMetadataFn('Help Requests', 'Organisation');
