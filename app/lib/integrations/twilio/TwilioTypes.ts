// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod/v4';

/**
 * Options regarding Twilio regions that our implementation can be tuned to. Note that not all
 * features and capabilities are available outside of US1, but nothing we currently rely on.
 *
 * @see https://www.twilio.com/docs/global-infrastructure#control-data-residency
 */
export const kTwilioRegion = {
    'US1': 'US1',
    'IE1': 'IE1',
    'AU1': 'AU1',
} as const;

/**
 * Options regarding Twilio regions that our implementation can be tuned to. Note that not all
 * features and capabilities are available outside of US1, but nothing we currently rely on.
 *
 * @see https://www.twilio.com/docs/global-infrastructure#control-data-residency
 */
export type TwilioRegion = typeof kTwilioRegion[keyof typeof kTwilioRegion];

/**
 * Zod type to validate a phone number, inclusive of country code.
 */
const kPhoneNumber = z.string().regex(/^[+]{1}(?:[0-9]\s?){6,15}[0-9]{1}$/);

/**
 * Common properties expected in every Twilio message.
 */
const kTwilioCommonMessage = z.object({
    /**
     * The phone number to which the message should be send.
     */
    to: kPhoneNumber,

    /**
     * Attribution that should be given to the message, i.e. its source.
     */
    attribution: z.strictObject({
        /**
         * User ID of the sender, if any.
         */
        senderUserId: z.number(),

    }).optional(),
});

/**
 * Body of a Twilio message, when distributing a regular text message.
 */
export const kTwilioSmsMessage = kTwilioCommonMessage.and(z.object({
    /**
     * Body of the message, as it should be send to the receiver.
     */
    body: z.string(),
}));

/**
 * Interface describing the data we expect from an SMS message to send over the Twilio API.
 */
export type TwilioSmsMessage = z.infer<typeof kTwilioSmsMessage>;

/**
 * Body of a Twilio message, when distributing a template-based message.
 */
export const kTwilioWhatsappMessage = kTwilioCommonMessage.and(z.object({
    /**
     * SID of the content template that dictates what the message contains.
     */
    contentSid: z.string(),

    /**
     * Variables to include in the message template.
     */
    contentVariables: z.record(z.string(), z.string()),
}));

/**
 * Interface describing the data we expect from a WhatsApp message to send over the Twilio API.
 */
export type TwilioWhatsappMessage = z.infer<typeof kTwilioWhatsappMessage>;
