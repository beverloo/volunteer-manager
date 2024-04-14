// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRequest } from 'next/server';
import { notFound } from 'next/navigation';

import type { TwilioWebhookEndpoint } from '@lib/database/Types';
import { readSetting } from '@lib/Settings';
import db, { tTwilioWebhookCalls} from '@lib/database';

/**
 * Authenticates that the given `request` indeed was issued by Twilio, based on the signature that
 * they (hopefully) included as an HTTP header. When the authentication was successful, the request
 * will be logged, and the request's body will be returned as a string.
 */
export async function authenticateAndRecordTwilioRequest(
    request: NextRequest, endpoint: TwilioWebhookEndpoint)
{
    const authToken = await readSetting('integration-twilio-account-auth-token');
    if (!authToken)
        notFound();  // Twilio is not enabled for this instance

    const requestBody = await request.text();

    const dbInstance = db;
    await dbInstance.insertInto(tTwilioWebhookCalls)
        .set({
            webhookCallDate: dbInstance.currentZonedDateTime(),
            webhookCallEndpoint: endpoint,
            webhookRequestSource: request.ip ?? request.headers.get('x-forwarded-for'),
            webhookRequestMethod: request.method,
            webhookRequestUrl: request.url,
            webhookRequestHeaders: JSON.stringify([ ...request.headers.entries() ]),
            webhookRequestBody: requestBody,
        })
        .executeInsert();

    // TODO: Actually authenticate and validate the `requestBody`.
    return requestBody;
}
