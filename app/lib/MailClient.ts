// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { default as nodemailer, type Transporter } from 'nodemailer';

import type { MailMessage } from './MailMessage';

/**
 * Confirm that global configuration is available when loading this file.
 */
if (!process.env.APP_SMTP_HOST || !process.env.APP_SMTP_PORT || !process.env.APP_SMTP_USERNAME ||
        !process.env.APP_SMTP_PASSWORD) {
    throw new Error('Volunteer Manager e-mail configuration must be set in environment variables.');
}

/**
 * The MailClient class encapsulates behaviour necessary to be able to send e-mails over SMTP. It
 * assumes configuration from the environment so that it will be built in in our image. Don't use
 * the MailClient for testing, rather, use the MailClientMock that doesn't talk to a real server.
 */
export class MailClient {
    #configuration: SMTPTransport.Options;

    #transport?: Transporter<SMTPTransport.SentMessageInfo>;
    #sender: string;

    constructor(sender?: string) {
        this.#configuration = {
            host: process.env.APP_SMTP_HOST!,
            port: parseInt(process.env.APP_SMTP_PORT!, /* radix= */ 10),
            auth: {
                user: process.env.APP_SMTP_USERNAME!,
                pass: process.env.APP_SMTP_PASSWORD!,
            },
        };

        this.#transport = undefined;
        this.#sender = `${sender || 'AnimeCon'} <${process.env.APP_SMTP_USERNAME}>`;
    }

    /**
     * Gets the sender from whom all sent e-mails will be addressed.
     */
    get sender() { return this.#sender; }

    /**
     * Distributes the given `message` over the configured SMTP connection. Returns a promise with
     * information about the sent message when successful, or throws an exception when a failure is
     * seen. (Regardless of whether it's with the message or with the transport.)
     *
     * @param message The message that should be send.
     * @returns Information about the sent message.
     */
    async sendMessage(message: MailMessage): Promise<SMTPTransport.SentMessageInfo> {
        if (!this.#transport)
            this.#transport = this.createTransport(this.#configuration);

        return this.#transport.sendMail({
            from: this.#sender,
            ...message.options,
        });
    }

    /**
     * Safe version of `sendMessage` that will not throw an exception, but will rather return a
     * boolean that indicates thether the given `message` was sent successfully.
     *
     * @param message The message that should be send.
     * @returns A boolean that indicates whether the message was handed off to the SMTP server.
     */
    async safeSendMessage(message: MailMessage): Promise<boolean> {
        try {
            await this.sendMessage(message);
            return true;

        } catch (error) {
            console.error('Unable to send an e-mail:', error);
        }

        return false;
    }

    /**
     * Verifies that the given SMTP server configuration is correct and can be used to send e-mail.
     * An exception will be thrown when the configuration is not correct.
     *
     * @returns True when everything works as expected. An exception will be thrown otherwise.
     */
    async verifyConfiguration(): Promise<true> {
        if (!this.#transport)
            this.#transport = this.createTransport(this.#configuration);

        return this.#transport!.verify();
    }

    /**
     * Creates the transport over which to send e-mail using the given `options`. Can be overridden
     * for testing purposes with a mock transport implementation.
     */
    protected createTransport(options: SMTPTransport.Options) {
        return nodemailer.createTransport(options);
    }
}
