// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { Privilege } from '@lib/auth/Privileges';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The webhooks page for Twilio messages details all information known about a particular message we
 * received from, you guessed it, Twilio. These generally are SMS and WhatsApp messages.
 */
export default async function TwilioWebhooksPage() {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.Administrator,
    });

    return <>TODO</>;
}

export const metadata: Metadata = {
    title: 'Twilio | Webhooks | AnimeCon Volunteer Manager',
};
