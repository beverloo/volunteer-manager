// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRequest } from 'next/server';

import { authenticateAndRecordTwilioRequest } from '../authenticateAndRecordTwilioRequest';
import db, { tOutboxTwilio } from '@lib/database';

import { kTwilioWebhookEndpoint } from '@lib/database/Types';

/**
 * Webhook invoked when the status of an outbound message has been updated. This may happen minutes,
 * sometimes even hours after sending the message, so we need to keep our stored state in sync.
 */
export async function POST(request: NextRequest) {
    const { authenticated, body } =
        await authenticateAndRecordTwilioRequest(request, kTwilioWebhookEndpoint.Outbound);

    if (!authenticated || !body) {
        return new Response(undefined, {
            status: /* HTTP Forbidden= */ 403,
        });
    }

    const from = body.get('From');
    const messageSid = body.get('MessageSid');
    const messageStatus = body.get('MessageStatus');

    if (!!from && !!messageSid && !!messageStatus) {
        const normalisedFrom = from.replace(/.*\:/, '');  // whatsapp:+44... -> +44...
        await db.update(tOutboxTwilio)
            .set({
                outboxSender: normalisedFrom,
                outboxResultStatus: messageStatus
            })
            .where(tOutboxTwilio.outboxResultSid.equals(messageSid))
            .executeUpdate();
    }

    return new Response(undefined, {
        status: /* HTTP OK= */ 200,
    });
}

export const dynamic = 'force-dynamic';
