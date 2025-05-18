// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { PersonalisedAdviceDataTable } from './PersonalisedAdviceDataTable';
import { createGenerateMetadataFn } from '../../../lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * This is the landing page for the Del a Rie Advies personalised advice service. These are AI
 * generated responses, for which it's important that we have the ability to inspect them.
 */
export default async function NardoPersonalisedPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.nardo',
    });

    return <PersonalisedAdviceDataTable />;
}

export const generateMetadata = createGenerateMetadataFn('Del a Rie Advies', 'Organisation');
