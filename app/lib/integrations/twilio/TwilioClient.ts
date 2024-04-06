// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import client from 'twilio';

import type { TwilioSmsMessage } from './TwilioTypes';
import { TwilioLogger } from './TwilioLogger';
import { kTwilioSmsMessage } from './TwilioTypes';

/**
 * Settings required by the Twilio client.
 */
export interface TwilioSettings {
    /**
     * SID through which we identify with the Twilio APIs.
     */
    accountSid: string;

    /**
     * Authentication token using which we authenticate with the Twilio APIs.
     */
    accountAuthToken: string;

    /**
     * Phone number using which messages will be send by default. Can either be a phone number
     * (including country code), or a short code existing of up to 11 alphanumerical characters.
     */
    phoneNumber: string;
}

/**
 * The Twilio client manages our interaction with the Twilio API. We use the Twilio NodeJS library
 * rather than direct REST messages to make our integration more reliable.
 */
export class TwilioClient {
    #client: ReturnType<typeof client>;
    #settings: TwilioSettings;

    constructor(settings: TwilioSettings) {
        this.#client = client(settings.accountSid, settings.accountAuthToken);
        this.#settings = settings;
    }

    /**
     * Sends an SMS message using the Twilio API to the user identified by `recipientUserId`. Will
     * validate the `message` in order to ensure that it conforms to Twilio's expectations.
     */
    async sendSmsMessage(recipientUserId: number, message: TwilioSmsMessage) {
        const logger = new TwilioLogger();
        await logger.initialiseSmsMessage(recipientUserId, this.#settings.phoneNumber, message);

        try {
            kTwilioSmsMessage.parse(message);  // verify before sending over the wire

            const messageInstance = await this.#client.messages.create({
                from: this.#settings.phoneNumber,
                to: message.to,
                body: message.body,
                // TODO: statusCallback
                // TODO: messagingServiceSid
            });

            // TODO: log the rest of `messageInstance`
        } catch (error: any) {
            logger.reportException(error);
            throw error;
        } finally {
            await logger.finalise();
        }
    }
}
