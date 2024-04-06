// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { TaskWithParams } from '../Task';
import { scheduleTask } from '@lib/scheduler';
import { createTwilioClient } from '@lib/integrations/twilio';

/**
 * Parameter scheme applying to the `SendWhatsappTask`. Observe that the sender is missing; this
 * will be inserted automatically by Twilio backend that deals with this message.
 */
const kSendWhatsappTaskParamScheme = z.object({
    /**
     * Phone number to which the message should be delivered.
     */
    to: z.string(),

    /**
     * SID of the content template that should be used.
     */
    contentSid: z.string(),

    /**
     * Variables to include in the message template.
     */
    contentVariables: z.record(z.string(), z.string()),

    /**
     * All e-mail messages distributed by the Volunteer Manager will be strictly attributed.
     */
    attribution: z.object({
        /**
         * User Id of the user who initiated sending this message.
         */
        sourceUserId: z.number(),

        /**
         * User Id of the user who will receive this message.
         */
        targetUserId: z.number(),
    }),
});


/**
 * Type definition of the parameter scheme, to be used by TypeScript.
 */
type TaskParams = z.infer<typeof kSendWhatsappTaskParamScheme>;

/**
 * A task that actually sends a WhatsApp message. We use the Twilio API to distribute the actual
 * message over the network, account information of which is available in integration settings.
 */
export class SendWhatsappTask extends TaskWithParams<TaskParams> {
    /**
     * Helper function to schedule sending a WhatsApp message. The message will be composed and sent
     * beyond the scope of the request during which this task is being scheduled.
     */
    static async Schedule(request: TaskParams, delayMs?: number): Promise<number> {
        kSendWhatsappTaskParamScheme.parse(request);
        return scheduleTask<TaskParams>({
            taskName: 'SendWhatsappTask',
            params: request,
            delayMs: delayMs ?? 0,
        });
    }

    override validate(params: unknown): TaskParams | never {
        return kSendWhatsappTaskParamScheme.parse(params);
    }

    override async execute(params: TaskParams): Promise<boolean> {
        const client = await createTwilioClient();
        return await client.sendWhatsappMessage(params.attribution.targetUserId, {
            to: params.to,
            contentSid: params.contentSid,
            contentVariables: params.contentVariables,
            attribution: {
                senderUserId: params.attribution.sourceUserId,
            },
        });
    }
}
