// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

/**
 * Zod type to validate a phone number, inclusive of country code.
 */
const kPhoneNumber = z.string().regex(/^[+]{1}(?:[0-9]\s?){6,15}[0-9]{1}$/);

/**
 * Type definition describing the exact data we expect from an SMS message.
 */
export const kTwilioSmsMessage = z.strictObject({
    /**
     * The phone number to which the message should be send.
     */
    to: kPhoneNumber,

    /**
     * Body of the message, as it should be send to the receiver.
     */
    body: z.string(),

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
 * Interface describing the data we expect from an SMS message to send over the Twilio API.
 */
export type TwilioSmsMessage = z.infer<typeof kTwilioSmsMessage>;
