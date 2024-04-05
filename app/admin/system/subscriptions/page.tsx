// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { Privilege } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { SubscriptionTable } from './SubscriptionTable';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <SubscriptionPage> is the main page of the subscription functionality, which allows us to
 * selectively sign up certain people to automated and/or privileged messaging.
 */
export default async function SubscriptionPage() {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemSubscriptionManagement,
    });

    return (
        <Section title="Subscriptions">
            <SectionIntroduction>
                Any person granted the <strong>subscription eligibility permission</strong> can be
                subscribed to a variety of notifications using a variety of communication channels.
            </SectionIntroduction>
            <SubscriptionTable />
        </Section>
    );
}

export const metadata: Metadata = {
    title: 'Subscriptions | AnimeCon Volunteer Manager',
};
