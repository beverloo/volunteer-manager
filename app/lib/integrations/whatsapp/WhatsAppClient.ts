// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { WhatsAppLoggerImpl } from './WhatsAppLogger';
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
    async sendMessage(recipientUserId: number, request: MessageRequest): Promise<boolean> {
        const logger = new WhatsAppLoggerImpl();
        let result = true;

        await logger.initialise(recipientUserId, request);
        try {
            const validatedMessageRequest = kMessageRequest.parse(request);

            // TODO: Remove this hack used for testing purposes
            if (validatedMessageRequest.to.startsWith('+31'))
                throw new Error('Something went wrong');

            // TODO: Issue the request
            // TODO: Obtain and validate the response

        } catch (error: any) {
            logger.reportException(error);
            result = false;
        }

        // TODO: Store the response w/ finalisation
        await logger.finalise(undefined);

        // TODO: Return whether sending the message was successful.
        return result;
    }
}
