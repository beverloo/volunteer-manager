// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRequest } from 'next/server';
import { notFound } from 'next/navigation';

import { validateRequest as validateTwilioRequest } from 'twilio';

import type { TwilioWebhookEndpoint } from '@lib/database/Types';
import { readSetting } from '@lib/Settings';
import db, { tTwilioWebhookCalls } from '@lib/database';

/**
 * Authenticates the received request from Twilio. The `authToken` is local information used as a
 * shared secret, whereas the received `url` and `params` will be used to compute a local signature,
 * which we will then compare against the provided `signature`.
 */
function authenticateRequest(
    authToken: string, signature: string, url: string, params: URLSearchParams): boolean
{
    const objectParams: Record<string, any> = {};
    for (const [ key, value ] of params)
        objectParams[key] = value;

    return validateTwilioRequest(authToken, signature, url, objectParams);
}

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
    const requestUrl = new URL(request.url);

    // Recompose the `requestUrl`. The Volunteer Manager runs in a Docker container, to which the
    // actual requests are being forwarded by a frontend such as Nginx.
    {
        requestUrl.protocol = 'https';
        requestUrl.hostname = request.headers.get('host') || 'stewards.team';
        requestUrl.port = '443';
    }

    let body: URLSearchParams | undefined;

    let signature: string | undefined;
    let authenticated = false;

    let messageSid: string | undefined;
    let messageOriginalSid: string | undefined;

    let errorName: string | undefined;
    let errorCause: string | undefined;
    let errorMessage: string | undefined;
    let errorStack: string | undefined;

    try {
        body = new URLSearchParams(requestBody);

        signature = body.get('x-twilio-signature') ?? undefined;
        if (!!signature)
            authenticated = authenticateRequest(authToken, signature, requestUrl.toString(), body);

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
            webhookRequestUrl: requestUrl.toString(),
            webhookRequestHeaders: JSON.stringify([ ...request.headers.entries() ]),
            webhookRequestBody: requestBody,

            webhookRequestSignature: signature,
            webhookRequestAuthenticated: !!authenticated ? 1 : 0,

            webhookMessageSid: messageSid,
            webhookMessageOriginalSid: messageOriginalSid,

            webhookErrorName: errorName,
            webhookErrorCause: errorCause,
            webhookErrorMessage: errorMessage,
            webhookErrorStack: errorStack,
        })
        .executeInsert();

    return { authenticated, body };
}
