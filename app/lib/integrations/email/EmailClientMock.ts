// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { default as nodemailermock } from 'nodemailer-mock';

import { EmailClient } from './EmailClient';

/**
 * Mock implementation of the MailClient that avoids using a real server.
 */
export class EmailClientMock extends EmailClient {
    constructor() {
        super({
            hostname: '127.0.0.1',
            port: 587,
            username: 'user@example.com',
            password: 'TestPassword1',
        });
    }

    /**
     * Returns the `nodemailer-mock` mock information, which allows instrumentation of the system.
     */
    get mock() { return nodemailermock.mock; }

    /**
     * Overrides the default transport with an instance of `nodemailer-mock`, which avoids messages
     * from being send to real e-mail addresses.
     */
    protected override createTransport(options: SMTPTransport.Options) {
        return nodemailermock.createTransport(options);
    }
}
