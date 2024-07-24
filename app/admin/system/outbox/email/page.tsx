// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { EmailDataTable } from './EmailDataTable';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The outbox page summarises all outgoing e-mail messages, and tells the volunteer whether they
 * have been successfully sent or ran into an issue somewhere. This page is only available to those
 * with specific permissions, as messages may contain e.g. password reset links.
 */
export default async function OutboxEmailPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'system.internals.outbox',
    });

    return <EmailDataTable />;
}

export const metadata: Metadata = {
    title: 'E-mail | Outbox | AnimeCon Volunteer Manager',
};
