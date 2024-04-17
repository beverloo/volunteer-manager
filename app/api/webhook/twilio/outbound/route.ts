// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRequest } from 'next/server';

import { TwilioWebhookEndpoint } from '@lib/database/Types';
import { authenticateAndRecordTwilioRequest } from '../authenticateAndRecordTwilioRequest';

/**
 * Webhook invoked when the status of an outbound message has been updated. This may happen minutes,
 * sometimes even hours after sending the message, so we need to keep our stored state in sync.
 */
export async function POST(request: NextRequest) {
    const { authenticated, body } =
        await authenticateAndRecordTwilioRequest(request, TwilioWebhookEndpoint.Outbound);

    // TODO: Do something with the `body`

    return new Response(undefined, {
        status: /* HTTP OK= */ 200,
    });
}

export const dynamic = 'force-dynamic';
