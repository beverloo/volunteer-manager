// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { Privilege } from '@lib/auth/Privileges';
import { TwilioDataTable } from '../TwilioDataTable';
import { TwilioOutboxType } from '@lib/database/Types';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The outbox page summarises all outgoing SMS messages.
 */
export default async function OutboxSmsPage() {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemOutboxAccess,
    });

    return <TwilioDataTable type={TwilioOutboxType.SMS} />;
}

export const metadata: Metadata = {
    title: 'SMS | Outbox | AnimeCon Volunteer Manager',
};
