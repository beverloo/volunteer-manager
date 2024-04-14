// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRequest } from 'next/server';

import twilio from 'twilio';

import { TwilioWebhookEndpoint } from '@lib/database/Types';
import { authenticateAndRecordTwilioRequest } from '../authenticateAndRecordTwilioRequest';

/**
 * Webhook invoked when an inbound message has been received over one of our communication channels,
 * generally either SMS or WhatsApp. An immediate response is expected.
 */
export async function GET(request: NextRequest) {
    const body = await authenticateAndRecordTwilioRequest(request, TwilioWebhookEndpoint.Inbound);
    // TODO: Do something with the `body`

    const response = new twilio.twiml.MessagingResponse();
    return new Response(response.toString(), {
        headers: [
            [ 'Content-Type', 'text/xml' ],
        ],
        status: /* HTTP OK= */ 200,
    });
}

export const dynamic = 'force-dynamic';
