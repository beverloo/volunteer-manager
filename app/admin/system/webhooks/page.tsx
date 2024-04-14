// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { Privilege } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { WebhookDataTable } from './WebhookDataTable';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The webhooks page lists all received webhooks from inbound services. These will be dealt with by
 * our system in a variety of ways, but all are (pre-authentication) stored for logging purposes.
 */
export default async function WebhooksPage() {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.Administrator,
    });

    return (
        <Section title="Webhooks">
            <WebhookDataTable />
        </Section>
    );
}

export const metadata: Metadata = {
    title: 'Webhooks | AnimeCon Volunteer Manager',
};
