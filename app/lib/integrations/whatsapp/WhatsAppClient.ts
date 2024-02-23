// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { MessageRequest, MessageResponse } from './WhatsAppTypes';
import { WhatsAppLogger } from './WhatsAppLogger';
import { kMessageRequest, kMessageResponse } from './WhatsAppTypes';

/**
 * Settings required by the WhatsApp client.
 */
export interface WhatsAppSettings {
    /**
     * Access token through which the WhatsApp For Business API can be reached.
     */
    accessToken: string;

    /**
     * Phone number ID as registered with the WhatsApp For Business API.
     */
    phoneNumberId: string;
}

/**
 * Signature of the `fetch` function which can be injected for testing purposes.
 */
type FetchFn = typeof globalThis.fetch;

/**
 * Returns whether the given response `status` is an OK response.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
 */
function isOK(status?: number) { return !!status && status >= 200 && status <= 299; }

/**
 * Base address of the endpoint to which we will be issuing API calls.
 */
const kEndpointBase = 'xx-https://graph.facebook.com/v18.0';

/**
 * The WhatsApp client manages our interaction with the WhatsApp for Business API. It takes the
 * required settings and then exposes convenience methods for making API calls.
 */
export class WhatsAppClient {
    #settings: WhatsAppSettings;
    #fetch: FetchFn;

    constructor(settings: WhatsAppSettings, fetch?: FetchFn) {
        this.#settings = settings;
        this.#fetch = fetch ?? globalThis.fetch;
    }

    /**
     * Send a WhatsApp message. The `request` contains all the required information and will be
     * strictly validated, beyond TypeScript type validity.
     */
    async sendMessage(recipientUserId: number, request: MessageRequest): Promise<boolean> {
        const logger = new WhatsAppLogger();
        await logger.initialise(recipientUserId, request);

        let responseData: MessageResponse | undefined;
        let responseStatus: number | undefined;

        try {
            const validatedMessageRequest = kMessageRequest.parse(request);

            const endpoint = `${kEndpointBase}/${this.#settings.phoneNumberId}/messages`;
            const response = await this.#fetch(endpoint, {
                method: 'POST',
                headers: [
                    [ 'Authorization', `Bearer ${this.#settings.accessToken}` ],
                    [ 'Content-Type', 'application/json' ],
                ],
                body: JSON.stringify(validatedMessageRequest),
            });

            responseStatus = response.status;
            responseData = kMessageResponse.parse(await response.json());
            // TODO: Deal with the `responseData`.

        } catch (error: any) {
            logger.reportException(error);
        }

        await logger.finalise(responseStatus, responseData);

        return isOK(responseStatus) && !!responseData && !logger.exception;
    }
}
