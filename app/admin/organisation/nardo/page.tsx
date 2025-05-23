// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { AdviceDataTable } from './AdviceDataTable';
import { createGenerateMetadataFn } from '../../lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * This is the main landing page for the Del a Rie Advies service. It allows the volunteer to manage
 * the advice made available by our wonderful friends of Del a Rie Advies.
 */
export default async function NardoPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.nardo',
    });

    return <AdviceDataTable />;
}

export const generateMetadata = createGenerateMetadataFn('Del a Rie Advies', 'Organisation');
