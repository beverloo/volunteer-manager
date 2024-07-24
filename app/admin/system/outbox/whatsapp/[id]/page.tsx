// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import type { NextPageParams } from '@lib/NextRouterParams';
import { TwilioDetailsPage } from '../../TwilioDetailsPage';
import { TwilioOutboxType } from '@lib/database/Types';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The outbox page details an outgoing WhatsApp message, with all information we have collected in
 * the database regarding delivery of that message.
 */
export default async function OutboxWhatsAppDetailsPage({ params }: NextPageParams<'id'>) {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'system.internals.outbox',
    });

    return <TwilioDetailsPage type={TwilioOutboxType.WhatsApp} id={parseInt(params.id, 10)} />;
}

export const metadata: Metadata = {
    title: 'WhatsApp | Outbox | AnimeCon Volunteer Manager',
};
