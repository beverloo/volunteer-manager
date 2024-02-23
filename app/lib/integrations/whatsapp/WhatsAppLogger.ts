// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { MessageRequest } from './WhatsAppTypes';
import db, { tWhatsAppMessages } from '@lib/database';

/**
 * Interface describing the WhatsApp logger.
 */
export interface WhatsAppLogger {
    /**
     * Initialises the WhatsApp logger. Loggers may only be initialized once.
     */
    initialise(recipientUserId: number, request: MessageRequest): Promise<void>;

    /**
     * Finalises the logger with the given `response`.
     */
    finalise(response?: unknown): Promise<void>;

    /**
     * Reports an exception that happened while the WhatsApp message was being sent.
     */
    reportException(error: Error): void;
}

/**
 * Implementation of the `WhatsAppLogger` interface to use for production use cases.
 */
export class WhatsAppLoggerImpl implements WhatsAppLogger {
    #exception?: Error = undefined;
    #startTime?: bigint = undefined;
    #insertId?: number = undefined;

    async initialise(recipientUserId: number, request: MessageRequest): Promise<void> {
        if (!!this.#insertId)
            throw new Error('WhatsApp loggers may only be initialised once.');

        this.#startTime = process.hrtime.bigint();
        this.#insertId = await db.insertInto(tWhatsAppMessages)
            .set({
                whatsappMessageRecipientUserId: recipientUserId,
                whatsappMessageRecipientPhoneNumber: request.to,
                whatsappMessageRequest: JSON.stringify(request),
            })
            .returningLastInsertedId()
            .executeInsert();
    }

    reportException(error: Error): void {
        this.#exception = error;
    }

    async finalise(response?: unknown): Promise<void> {
        if (!this.#insertId || !this.#startTime)
            throw new Error('WhatsApp loggers must be initialised before being finalised.');

        await db.update(tWhatsAppMessages)
            .set({
                whatsappMessageErrorName: this.#exception?.name,
                whatsappMessageErrorMessage: this.#exception?.message,
                whatsappMessageErrorStack: this.#exception?.stack,
                whatsappMessageErrorCause:
                    this.#exception?.cause ? JSON.stringify(this.#exception?.cause) : undefined,

                whatsappMessageResponseTime:
                    Number((process.hrtime.bigint() - this.#startTime) / 1000n / 1000n),
                // TODO: Store the `response`
            })
            .where(tWhatsAppMessages.whatsappMessageId.equals(this.#insertId))
            .executeUpdate();

        this.#insertId = undefined;
        this.#startTime = undefined;
    }
}
