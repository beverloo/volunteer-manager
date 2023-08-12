// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { LogType, Log } from '@lib/Log';
import { MailClient } from '@lib/MailClient';
import { MailMessage } from '@app/lib/MailMessage';
import { User } from '@lib/auth/User';
import { getStaticContent } from '@lib/Content';
import { sealPasswordResetRequest } from '@lib/auth/PasswordReset';

/**
 * Interface definition for the PasswordResetRequest API, exposed through
 * /api/auth/password-reset-request.
 */
export const kPasswordResetRequestDefinition = z.object({
    request: z.object({
        /**
         * The username for whom the password reset request should be issued.
         */
        username: z.string().email(),
    }),

    response: z.strictObject({
        /**
         * Whether an e-mail has been send to their address with a reset password link.
         */
        success: z.boolean(),
    }),
});

export type PasswordResetRequestDefinition = z.infer<typeof kPasswordResetRequestDefinition>;

type Request = PasswordResetRequestDefinition['request'];
type Response = PasswordResetRequestDefinition['response'];

/**
 * This API enables the client to confirm whether an account exists with a particular username. When
 * this is the case, selected WebAuthn data will be included in the response to allow the user to
 * sign in without relying on their password.
 */
export async function passwordResetRequest(request: Request, props: ActionProps)
    : Promise<Response>
{
    const passwordResetData = await User.getPasswordResetData(request.username);
    if (passwordResetData) {
        const passwordResetRequest = await sealPasswordResetRequest({
            id: passwordResetData.userId,
            token: passwordResetData.sessionToken,
        });

        const messageContent = await getStaticContent([ 'message', 'lost-password' ]);
        if (messageContent) {
            const sender = 'AnimeCon Volunteering Teams';
            const passwordResetLink =
                `${props.origin}/?password-reset-request=${passwordResetRequest}`;

            const client = new MailClient(sender);
            const message = new MailMessage()
                .setTo(request.username)
                .setSubject(messageContent.title)
                .setMarkdown(messageContent.markdown, /* substitutions= */ {
                    'link': passwordResetLink,
                    'name': passwordResetData.firstName,
                    'sender': sender,
                });

            await client.safeSendMessage(message);

            Log({
                type: LogType.AccountPasswordResetRequest,
                sourceUser: passwordResetData.userId,
                data: { ip: props.ip }
            });

            return { success: true };
        }

        console.error('Unable to send a password reset e-mail: cannot find the content.');
    }

    return { success: false };
}
