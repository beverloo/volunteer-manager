// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import Alert from '@mui/material/Alert';

import { Privilege } from '@lib/auth/Privileges';
import { RecipientTable } from './RecipientTable';
import { Section } from '@app/admin/components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tUsers } from '@lib/database';

/**
 * The WhatsApp page allows certain administrators to configure who should be receiving certain
 * notifications through WhatsApp as a messaging channel. Given that we have to manually implement
 * 1:M messaging, individuals will always have to be manually added.
 */
export default async function WhatsAppPage() {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemWhatsAppAccess,
    });

    const users = await db.selectFrom(tUsers)
        .where(tUsers.phoneNumber.isNotNull())
        .select({
            value: tUsers.userId,
            label: tUsers.name,
        })
        .orderBy('label', 'asc')
        .executeSelectMany();

    return (
        <>
            <Section title="WhatsApp messages">
                <Alert severity="warning">
                    The outgoing message table has not been implemented yet.
                </Alert>
            </Section>
            <Section title="WhatsApp recipients">
                <Alert severity="info">
                    The following table contains all people who will receive notifications through
                    WhatsApp. Since group messaging is not available through the official API, we
                    need to consider message volume and cannot automatically send everything to
                    everyone.
                </Alert>
                <RecipientTable users={users} />
            </Section>
        </>
    );
}

export const metadata: Metadata = {
    title: 'WhatsApp | AnimeCon Volunteer Manager',
};
