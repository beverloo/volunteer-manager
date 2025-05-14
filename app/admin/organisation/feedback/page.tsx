// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Section } from '../../components/Section';
import { SectionIntroduction } from '../../components/SectionIntroduction';
import { createGenerateMetadataFn } from '../../lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { FeedbackDataTable } from './FeedbackDataTable';

/**
 * Page that lists feedback received through the Volunteer Manager. All feedback is read-only, and
 * cannot be actioned or acknowledged directly from the portal.
 */
export default async function FeedbackPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.feedback',
    });

    return (
        <Section title="Feedback">
            <SectionIntroduction>
                This page lists feedback received from volunteers via the Volunteer Portal. Entries
                are attributed to the volunteer, and cannot be updated or removed.
            </SectionIntroduction>
            <FeedbackDataTable />
        </Section>
    );
}

export const generateMetadata = createGenerateMetadataFn('Feedback', 'Organisation');
