// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { kMessageRequest, type MessageRequest } from './WhatsAppTypes';

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
 * Base address of the endpoint to which we will be issuing API calls.
 */
const kEndpointBase = 'https://graph.facebook.com/v18.0';

/**
 * The WhatsApp client manages our interaction with the WhatsApp for Business API. It takes the
 * required settings and then exposes convenience methods for making API calls.
 */
export class WhatsAppClient {
    #settings: WhatsAppSettings;

    constructor(settings: WhatsAppSettings) {
        this.#settings = settings;
    }

    /**
     * Send a WhatsApp message. The `request` contains all the required information and will be
     * strictly validated, beyond TypeScript type validity.
     */
    async sendMessage(request: MessageRequest) {
        const validatedMessageRequest = kMessageRequest.parse(request);

        // TODO: Store the `request` in the database.

        const response = await fetch(`${kEndpointBase}/${this.#settings.phoneNumberId}/messages`, {
            method: 'POST',
            headers: [
                [ 'Authorization', `Bearer ${this.#settings.accessToken}` ],
                [ 'Content-Type', 'application/json' ],
            ],
            body: JSON.stringify(validatedMessageRequest),
        });

        // TODO: Something something error handling.
        // TODO: Store the result (& message ID) in the database.

        return await response.json();
    }
}
