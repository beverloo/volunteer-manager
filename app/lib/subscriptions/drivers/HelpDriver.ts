// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Driver, type Message, type Recipient } from '../Driver';
import { DisplayHelpRequestTarget } from '@lib/database/Types';
import { SendEmailTask } from '@lib/scheduler/tasks/SendEmailTask';
import { SendSmsTask } from '@lib/scheduler/tasks/SendSmsTask';
import { SendWhatsappTask } from '@lib/scheduler/tasks/SendWhatsappTask';

/**
 * Converts a `DisplayHelpRequestTarget` value to a `typeId` value supported by this driver.
 */
export const kTargetToTypeId: { [k in DisplayHelpRequestTarget]: number } = {
    [DisplayHelpRequestTarget.Crew]: 0,
    [DisplayHelpRequestTarget.Nardo]: 1,
    [DisplayHelpRequestTarget.Stewards]: 2
};

/**
 * Information that must be provided when publishing a help request from one of the displays.
 */
export interface HelpMessage extends Message {
    // TODO
}

/**
 * Driver that deals with subscriptions that have the `Help` type.
 */
export class HelpDriver extends Driver<HelpDriver> {
    override async publishEmail(
        publicationId: number, recipient: Recipient, message: HelpDriver)
    {
        // TODO: Support publishing e-mails
        return false;
    }

    override async publishSms(publicationId: number, recipient: Recipient, message: HelpDriver) {
        // TODO: Support publishing text messages
        return false;
    }

    override async publishWhatsapp(publicationId: number, recipient: Recipient, message: HelpDriver)
    {
        // TODO: Support publishing WhatsApp messages
        return false;
    }
}
