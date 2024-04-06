// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Driver, type Message, type Recipient } from '../Driver';

/**
 * Information that must be provided when publishing an application notification.
 */
export interface ApplicationMessage extends Message {
    /**
     * Full name of the person who has applied to help out in an event.
     */
    name: string;

    /**
     * Name of the team
     */
    team: string;
}

/**
 * Driver that deals with subscriptions that have the `Application` type.
 */
export class ApplicationDriver extends Driver<ApplicationMessage> {
    override async publishEmail(
        publicationId: number,recipient: Recipient, message: ApplicationMessage)
    {
        // TODO: Not yet implemented.
        return false;
    }

    override async publishNotification(
        publicationId: number, recipient: Recipient, message: ApplicationMessage)
    {
        // TODO: Not yet implemented.
        return false;
    }

    override async publishSms(
        publicationId: number, recipient: Recipient, message: ApplicationMessage)
    {
        // TODO: Not yet implemented.
        return false;
    }

    override async publishWhatsapp(
        publicationId: number, recipient: Recipient, message: ApplicationMessage)
    {
        // TODO: Not yet implemented.
        return false;
    }
}
