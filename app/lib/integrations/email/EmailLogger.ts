// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Address, AttachmentLike } from 'nodemailer/lib/mailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Readable } from 'stream';

import type { EmailMessage } from './EmailMessage';
import type { SendMessageRequest } from './EmailClient';
import { User } from '@lib/auth/User';
import db, { tOutbox } from '@lib/database';

/**
 * Interface describing the e-mail logger.
 */
export interface EmailLogger {
    /**
     * Initialises the e-mail logger. Loggers may only be initialized once.
     */
    initialise(request: SendMessageRequest): Promise<void>;

    /**
     * Finalises the logger with the `info`, obtained from the sending operation.
     */
    finalise(info: SMTPTransport.SentMessageInfo): Promise<void>;
}

/**
 * Actual implementation of the e-mail logger. Will be overridden for testing by the EmailClientMock
 * so that nothing is stored in the database.
 */
export class EmailLoggerImpl implements EmailLogger {
    #insertId?: number;

    constructor() {
        this.#insertId = undefined;
    }

    /**
     * Initialises the logger. This is called before the message will be send over SMTP, and will
     * store the message in the database, sort of as an "outbox".
     */
    async initialise(request: SendMessageRequest) {
        if (!!this.#insertId)
            throw new Error('E-mail loggers may only be initialised once.');

        const options = request.message.options;

        this.#insertId = await db.insertInto(tOutbox)
            .set({
                outboxSender: request.sender,
                outboxSenderUserId: this.normalizeUser(request.sourceUser),
                outboxTo: this.normalizeRecipients(options.to)!,
                outboxToUserId: this.normalizeUser(request.targetUser),
                outboxCc: this.normalizeRecipients(options.cc),
                outboxBcc: this.normalizeRecipients(options.bcc),
                outboxHeaders: JSON.stringify(options.headers),
                outboxSubject: options.subject ?? '<no subject>',
                outboxBodyHtml: this.normalizeContent(options.html),
                outboxBodyText: this.normalizeContent(options.text),
            })
            .returningLastInsertedId()
            .executeInsert();
    }

    /**
     * Normalizes the User ID from the given `input`. The database only stores with IDs.
     */
    private normalizeUser(input?: User | number): number | null {
        if (typeof input === 'number')
            return input;
        else if (input instanceof User)
            return input.userId;

        return null;
    }

    /**
     * Normalizes the given `input` in a string that can be stored in a log.
     */
    private normalizeRecipients(input?: string | Address | Array<string | Address>): string | null {
        if (!input)
            return null;

        const inputArray = Array.isArray(input) ? input : [ input ];
        const normalizedArray = inputArray.map(individualAddress => {
            return typeof individualAddress === 'string' ? individualAddress
                                                         : individualAddress.address;
        });

        return normalizedArray.join(', ');
    }

    /**
     * Normalizes the given `input` in a string that can be stored in a log.
     */
    private normalizeContent(input?: string | Buffer | Readable | AttachmentLike): string {
        if (!input)
            return /* empty content= */ '';

        if (typeof input === 'string')
            return input;
        else if (input instanceof Buffer)
            return input.toString('utf-8');
        else if (input instanceof Readable)
            throw new Error('Unable to normalize Readable streams, not yet implemented.');

        throw new Error('Unable to normalize the e-mail content, unrecognised type.');
    }

    /**
     * Finalises the logger. This will write the `info` to the database entry, which will tell us
     * whether the message had been sent successfully.
     */
    async finalise(info: SMTPTransport.SentMessageInfo) {
        if (!this.#insertId)
            throw new Error('E-mail loggers must be initialised before being finalised.');

        await db.update(tOutbox)
            .set({
                outboxResultMessageId: info.messageId,
                outboxResultAccepted: this.normalizeRecipients(info.accepted),
                outboxResultRejected: this.normalizeRecipients(info.rejected),
                outboxResultPending: this.normalizeRecipients(info.pending),
                outboxResultResponse: info.response,
            })
            .where(tOutbox.outboxId.equals(this.#insertId))
            .executeUpdate();

        this.#insertId = undefined;
    }
}