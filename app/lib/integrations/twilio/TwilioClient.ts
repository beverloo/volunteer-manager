// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import client from 'twilio';

import type { TwilioSmsMessage, TwilioWhatsappMessage } from './TwilioTypes';
import { TwilioLogger } from './TwilioLogger';

import { kTwilioOutboxType } from '@lib/database/Types';
import { kTwilioSmsMessage, kTwilioWhatsappMessage, type TwilioRegion } from './TwilioTypes';

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
     * SID of the messaging service used to distribute SMS messages.
     */
    messagingSidSms: string;

    /**
     * SID of the messaging service used to distribute WhatsApp messages.
     */
    messagingSidWhatsapp: string;

    /**
     * Region in which the Twilio API endpoint should ideally be located.
     */
    region?: TwilioRegion;
}

/**
 * The Twilio client manages our interaction with the Twilio API. We use the Twilio NodeJS library
 * rather than direct REST messages to make our integration more reliable.
 */
export class TwilioClient {
    #client: ReturnType<typeof client>;
    #settings: TwilioSettings;

    constructor(settings: TwilioSettings) {
        this.#client = client(settings.accountSid, settings.accountAuthToken, {
            region: !!settings.region ? `${settings.region}` : undefined
        });

        this.#settings = settings;
    }

    /**
     * Sends an SMS message using the Twilio API to the user identified by `recipientUserId`. Will
     * validate the `message` in order to ensure that it conforms to Twilio's expectations.
     */
    async sendSmsMessage(recipientUserId: number, message: TwilioSmsMessage): Promise<boolean> {
        const logger = new TwilioLogger(kTwilioOutboxType.SMS);
        await logger.initialiseMessage(recipientUserId, message);

        let messageInstance: MessageInstance | undefined;
        try {
            kTwilioSmsMessage.parse(message);  // verify before sending over the wire
            messageInstance = await this.#client.messages.create({
                messagingServiceSid: this.#settings.messagingSidSms,
                to: message.to,
                body: message.body,
            });
        } catch (error: any) {
            logger.reportException(error);
            throw error;
        } finally {
            await logger.finalise(messageInstance);
        }

        return !!messageInstance;
    }

    /**
     * Sends a WhatsApp message using the Twilio API to the user identified by `recipientUserId`.
     * Will validate the `message` in order to ensure that it conforms to Twilio's expectations.
     */
    async sendWhatsappMessage(recipientUserId: number, message: TwilioWhatsappMessage)
        : Promise<boolean>
    {
        const logger = new TwilioLogger(kTwilioOutboxType.WhatsApp);
        await logger.initialiseMessage(recipientUserId, message);

        let messageInstance: MessageInstance | undefined;
        try {
            kTwilioWhatsappMessage.parse(message);  // verify before sending over the wire
            messageInstance = await this.#client.messages.create({
                messagingServiceSid: this.#settings.messagingSidWhatsapp,
                to: `whatsapp:${message.to}`,
                contentSid: message.contentSid,
                contentVariables: JSON.stringify(message.contentVariables),
            });
        } catch (error: any) {
            logger.reportException(error);
            throw error;
        } finally {
            await logger.finalise(messageInstance);
        }

        return !!messageInstance;
    }
}
