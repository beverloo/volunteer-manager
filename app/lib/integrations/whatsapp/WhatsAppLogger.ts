// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { MessageRequest, MessageResponse } from './WhatsAppTypes';
import db, { tOutboxWhatsApp } from '@lib/database';

/**
 * The `WhatsAppLogger` is able to encapsulate the lifetime of a WhatsApp message request and log
 * all activity to the database.
 */
export class WhatsAppLogger {
    #exception?: Error = undefined;
    #startTime?: bigint = undefined;
    #insertId?: number = undefined;

    /**
     * Initialises the WhatsApp logger. Loggers may only be initialized once.
     */
    async initialise(recipientUserId: number, request: MessageRequest): Promise<void> {
        if (!!this.#insertId)
            throw new Error('WhatsApp loggers may only be initialised once.');

        this.#startTime = process.hrtime.bigint();
        this.#insertId = await db.insertInto(tOutboxWhatsApp)
            .set({
                whatsappRecipientUserId: recipientUserId,
                whatsappRecipientPhoneNumber: request.to,
                whatsappRequest: JSON.stringify(request),
            })
            .returningLastInsertedId()
            .executeInsert();
    }

    /**
     * Returns the exception iff one has been filed.
     */
    get exception() { return this.#exception; }

    /**
     * Reports an exception that happened while the WhatsApp message was being sent.
     */
    reportException(error: Error): void {
        this.#exception = error;
    }

    /**
     * Finalises the logger with the given `responseStatus` and `responseData`.
     */
    async finalise(
        responseStatus?: number, messageId?: string, messageStatus?: string,
        responseData?: MessageResponse)
    {
        if (!this.#insertId || !this.#startTime)
            throw new Error('WhatsApp loggers must be initialised before being finalised.');

        await db.update(tOutboxWhatsApp)
            .set({
                whatsappErrorName: this.#exception?.name,
                whatsappErrorMessage: this.#exception?.message,
                whatsappErrorStack: this.#exception?.stack,
                whatsappErrorCause:
                    this.#exception?.cause ? JSON.stringify(this.#exception?.cause) : undefined,

                whatsappResponseStatus: responseStatus,
                whatsappResponseTime:
                    Number((process.hrtime.bigint() - this.#startTime) / 1000n / 1000n),
                whatsappResponseMessageId: messageId,
                whatsappResponseMessageStatus: messageStatus,
                whatsappResponseText: JSON.stringify(responseData),
            })
            .where(tOutboxWhatsApp.whatsappMessageId.equals(this.#insertId))
            .executeUpdate();

        this.#insertId = undefined;
        this.#startTime = undefined;
    }
}
