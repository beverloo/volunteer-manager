// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation'

import { RegistrationContent } from '../registration/RegistrationContent';
import { RegistrationLayout } from '../registration/RegistrationLayout';
import { getRequestEnvironment } from '@lib/getRequestEnvironment';
import { getStaticContent } from '@lib/Content';
import { useUser } from '@lib/auth/useUser';

/**
 * Root component for the /private page, which lists the GDPR and data collection policies of the
 * AnimeCon volunteer manager. The policies are stored in the database and rendered using Markdown
 * to make updating them - where needed - easier.
 */
export default async function PrivacyPage() {
    const environment = getRequestEnvironment();
    const user = await useUser('ignore');

    const content = await getStaticContent([ 'privacy' ]);
    if (!content)
        notFound();  // TODO: Only do this for non-content pages

    return (
        <RegistrationLayout environment={environment}>
            <RegistrationContent content={content}
                                 title="GDPR & Data Sharing Policies"
                                 user={user?.toUserData()} />
        </RegistrationLayout>
    );
}
