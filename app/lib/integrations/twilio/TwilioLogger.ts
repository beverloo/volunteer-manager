// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';

import type { TwilioOutboxType } from '@lib/database/Types';
import type { TwilioMessage } from './TwilioTypes';
import db, { tOutboxTwilio } from '@lib/database';

/**
 * The `TwilioLogger` is able to encapsulate the calls that we make to the Twilio API, with all the
 * necessary metainformation in order to track the performance of our integration.
 */
export class TwilioLogger {
    #type: TwilioOutboxType;
    #exception?: Error = undefined;
    #startTime?: bigint = undefined;
    #insertId?: number = undefined;

    constructor(type: TwilioOutboxType) {
        this.#type = type;
    }

    /**
     * Initialises the Twilio logger. Loggers may only be initialized once.
     */
    async initialiseMessage(recipientUserId: number, message: TwilioMessage) {
        if (!!this.#insertId)
            throw new Error('Twilio loggers may only be initialised once.');

        const dbInstance = db;

        this.#startTime = process.hrtime.bigint();
        this.#insertId = await dbInstance.insertInto(tOutboxTwilio)
            .set({
                outboxTimestamp: dbInstance.currentZonedDateTime(),
                outboxType: this.#type,
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
    async finalise(messageInstance?: MessageInstance) {
        if (!this.#insertId || !this.#startTime)
            throw new Error('Twilio loggers must be initialised before being finalised.');

        const runtime = Number((process.hrtime.bigint() - this.#startTime) / 1000n / 1000n);

        await db.update(tOutboxTwilio)
            .set({
                outboxSender: messageInstance?.from,

                outboxErrorName: this.#exception?.name,
                outboxErrorMessage: this.#exception?.message,
                outboxErrorStack: this.#exception?.stack,
                outboxErrorCause:
                    this.#exception?.cause ? JSON.stringify(this.#exception?.cause) : undefined,

                outboxResultStatus: messageInstance?.status,
                outboxResultSid: messageInstance?.sid,
                outboxResultTime: runtime,
                outboxResultErrorCode: messageInstance?.errorCode,
                outboxResultErrorMessage: messageInstance?.errorMessage,
            })
            .where(tOutboxTwilio.outboxTwilioId.equals(this.#insertId))
            .executeUpdate();

        this.#insertId = undefined;
        this.#startTime = undefined;
    }
}
