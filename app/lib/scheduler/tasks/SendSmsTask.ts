// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { TaskWithParams } from '../Task';
import { scheduleTask } from '@lib/scheduler';
import { createTwilioClient } from '@lib/integrations/twilio';

/**
 * Parameter scheme applying to the `SendSmsTask`. Observe that the sender is missing; this will be
 * inserted automatically by the routine that delivers the message.
 */
const kSendSmsTaskParamScheme = z.object({
    /**
     * Phone number to which the message should be delivered.
     */
    to: z.string(),

    /**
     * Message that should be send.
     */
    message: z.string(),

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
type TaskParams = z.infer<typeof kSendSmsTaskParamScheme>;

/**
 * A task that actually sends a text message. We use the Twilio API to distribute the actual message
 * over the network, account information of which is available in integration settings.
 */
export class SendSmsTask extends TaskWithParams<TaskParams> {
    /**
     * Helper function to schedule sending an SMS. The message will be composed and sent beyond
     * the scope of the request during which this task is being scheduled. Returns the task Id.
     */
    static async Schedule(request: TaskParams, delayMs?: number): Promise<number> {
        return scheduleTask<TaskParams>({
            taskName: 'SendSmsTask',
            params: request,
            delayMs: delayMs ?? 0,
        });
    }

    override validate(params: unknown): TaskParams | never {
        return kSendSmsTaskParamScheme.parse(params);
    }

    override async execute(params: TaskParams): Promise<boolean> {
        const client = await createTwilioClient();
        return await client.sendSmsMessage(params.attribution.targetUserId, {
            to: params.to,
            body: params.message,
            attribution: {
                senderUserId: params.attribution.sourceUserId,
            },
        });
    }
}
