// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { MessageRequest, MessageResponse } from './WhatsAppTypes';
import db, { tWhatsAppMessages } from '@lib/database';

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
        this.#insertId = await db.insertInto(tWhatsAppMessages)
            .set({
                whatsappMessageRecipientUserId: recipientUserId,
                whatsappMessageRecipientPhoneNumber: request.to,
                whatsappMessageRequest: JSON.stringify(request),
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

        await db.update(tWhatsAppMessages)
            .set({
                whatsappMessageErrorName: this.#exception?.name,
                whatsappMessageErrorMessage: this.#exception?.message,
                whatsappMessageErrorStack: this.#exception?.stack,
                whatsappMessageErrorCause:
                    this.#exception?.cause ? JSON.stringify(this.#exception?.cause) : undefined,

                whatsappMessageResponseStatus: responseStatus,
                whatsappMessageResponseTime:
                    Number((process.hrtime.bigint() - this.#startTime) / 1000n / 1000n),
                whatsappMessageResponseMessageId: messageId,
                whatsappMessageResponseMessageStatus: messageStatus,
                whatsappMessageResponseText: JSON.stringify(responseData),
            })
            .where(tWhatsAppMessages.whatsappMessageId.equals(this.#insertId))
            .executeUpdate();

        this.#insertId = undefined;
        this.#startTime = undefined;
    }
}
