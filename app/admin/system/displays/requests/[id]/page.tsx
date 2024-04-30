// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Privilege } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The display request page provides detailed access to an individual help request received from one
 * of the displays, providing a detailed timeline and insights in what happened, and when.
 */
export default async function DisplayRequestPage(props: NextPageParams<'id'>) {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemDisplayAccess,
    });

    return (
        <Section title="Help request">
            <SectionIntroduction important>
                This page has not been implemented yet.
            </SectionIntroduction>
        </Section>
    );
}

export const metadata: Metadata = {
    title: 'Help request | Displays | AnimeCon Volunteer Manager',
};
