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

    let body: URLSearchParams | undefined;

    let messageSid: string | undefined;
    let messageOriginalSid: string | undefined;

    let errorName: string | undefined;
    let errorCause: string | undefined;
    let errorMessage: string | undefined;
    let errorStack: string | undefined;

    try {
        // TODO: Actually authenticate and validate the `requestBody`.
        body = new URLSearchParams(requestBody);

        messageSid = body.get('MessageSid') ?? undefined;
        messageOriginalSid = body.get('OriginalRepliedMessageSid') ?? undefined;

    } catch (error: any) {
        errorName = error.name;
        errorCause = !!error.cause ? JSON.stringify(error.cause) : undefined;
        errorMessage = error.message;
        errorStack = error.stack;
    }


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
            // TODO: `webhookRequestSignature`

            webhookMessageSid: messageSid,
            webhookMessageOriginalSid: messageOriginalSid,

            webhookErrorName: errorName,
            webhookErrorCause: errorCause,
            webhookErrorMessage: errorMessage,
            webhookErrorStack: errorStack,
        })
        .executeInsert();

    return body;
}
