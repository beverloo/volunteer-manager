// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { OutboxMessage } from './OutboxMessage';
import { Privilege } from '@lib/auth/Privileges';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The message outbox page displays an individual message that was sent through the Volunteer
 * Manager. It includes all metainformation, including logs regarding the result. This entire page
 * is rendered client-side as it depends on an API.
 */
export default async function OutboxPage(props: NextRouterParams<'id'>) {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemOutboxAccess,
    });

    return <OutboxMessage id={parseInt(props.params.id, 10)} />;
}

export const metadata: Metadata = {
    title: 'Message | AnimeCon Volunteer Manager',
};
