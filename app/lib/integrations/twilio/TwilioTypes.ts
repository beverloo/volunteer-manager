// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

/**
 * Options regarding Twilio regions that our implementation can be tuned to. Note that not all
 * features and capabilities are available outside of US1, but nothing we currently rely on.
 *
 * @see https://www.twilio.com/docs/global-infrastructure#control-data-residency
 */
export enum TwilioRegion {
    'US1' = 'US1',
    'IE1' = 'IE1',
    'AU1' = 'AU1',
}

/**
 * Zod type to validate a phone number, inclusive of country code.
 */
const kPhoneNumber = z.string().regex(/^[+]{1}(?:[0-9]\s?){6,15}[0-9]{1}$/);

/**
 * Type definition describing the exact data we expect from an message.
 */
export const kTwilioMessage = z.strictObject({
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
 * Interface describing the data we expect from an message to send over the Twilio API.
 */
export type TwilioMessage = z.infer<typeof kTwilioMessage>;
