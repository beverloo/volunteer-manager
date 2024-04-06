// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import db, { tOutboxTwilio } from '@lib/database';
import type { TwilioSmsMessage } from './TwilioTypes';

/**
 * The `TwilioLogger` is able to encapsulate the calls that we make to the Twilio API, with all the
 * necessary metainformation in order to track the performance of our integration.
 */
export class TwilioLogger {
    #exception?: Error = undefined;
    #startTime?: bigint = undefined;
    #insertId?: number = undefined;

    /**
     * Initialises the Twilio logger. Loggers may only be initialized once.
     */
    async initialiseSmsMessage(recipientUserId: number, sender: string, message: TwilioSmsMessage) {
        if (!!this.#insertId)
            throw new Error('Twilio loggers may only be initialised once.');

        const dbInstance = db;

        this.#startTime = process.hrtime.bigint();
        this.#insertId = await dbInstance.insertInto(tOutboxTwilio)
            .set({
                outboxTimestamp: dbInstance.currentZonedDateTime(),
                outboxSender: sender,
                outboxSenderUserId: message.attribution?.senderUserId,
                outboxRecipient: message.to,
                outboxRecipientUserId: recipientUserId,
                outboxMessage: message.body,
            })
            .returningLastInsertedId()
            .executeInsert();
    }

    /**
     * Returns the exception iff one has been filed.
     */
    get exception() { return this.#exception; }

    /**
     * Reports an exception that happened while the Twilio message was being sent.
     */
    reportException(error: Error): void {
        this.#exception = error;
    }

    /**
     * Finalises the logger with the given `responseStatus` and `responseData`.
     */
    async finalise()
    {
        if (!this.#insertId || !this.#startTime)
            throw new Error('Twilio loggers must be initialised before being finalised.');

        // TODO: Update the table.

        this.#insertId = undefined;
        this.#startTime = undefined;
    }
}
