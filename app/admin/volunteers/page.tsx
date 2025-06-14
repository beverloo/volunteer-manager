// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * Overview page showing all users who volunteered at at least one of the AnimeCon events, displayed
 * in a Data Table. Provides access to individual user pages.
 */
export default async function VolunteersPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: {
            permission: 'organisation.accounts',
            operation: 'read',
        },
    });

    return (
        <Section title="Volunteers">
            <SectionIntroduction important>
                This page is no longer being used and will be removed soon.
            </SectionIntroduction>
        </Section>
    );
}
