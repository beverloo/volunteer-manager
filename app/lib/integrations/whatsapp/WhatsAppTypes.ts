// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

/**
 * Type that describes a parameter given as part of a WhatsApp message sending request.
 *
 * @version v18.0
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#parameter-object
 */
const kMessageRequestComponentParameter = z.object({
    type: z.literal('text'),  // currency, date_time, document, image, video
    text: z.string().min(1).max(1024),
});

/**
 * Type that describes the parameters given to a component of a WhatsApp message template, part of
 * a message sending request.
 *
 * @version v18.0
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#components-object
 */
const kMessageRequestComponent = z.discriminatedUnion('type', [
    z.object({
        type: z.enum([ 'header', 'body' ]),
    }),
    z.object({
        type: z.literal('button'),
        sub_type: z.enum([ 'catalog', 'quick_reply', 'url' ]),
        index: z.number().min(0).max(9),
    }),
]).and(z.object({
    parameters: z.array(kMessageRequestComponentParameter),
}));

/**
 * Type that describes a message request, which must be send to the /messages endpoint relative to
 * the used phone number Id.
 *
 * @version v18.0
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 * @see https://developers.facebook.com/docs/whatsapp/on-premises/reference/messages#formatting
 */
export const kMessageRequest = z.object({
    // TODO: audio
    // TODO: biz_opaque_callback_data
    // TODO: contacts
    // TODO: context
    // TODO: document
    // TODO: hsm (deprecated)
    // TODO: image
    // TODO: interactive
    // TODO: location
    messaging_product: z.literal('whatsapp'),
    // TODO: preview_url
    // TODO: recipient_type
    // TODO: status
    // TODO: sticker
    to: z.string().regex(/^\+\d{8,}$/),

}).and(z.discriminatedUnion('type', [
    z.object({
        type: z.literal('text'),
        text: z.object({
            body: z.string().min(1).max(4096),
            preview_url: z.boolean().optional(),
        }),
    }),
    z.object({
        type: z.literal('template'),
        template: z.object({
            name: z.string().min(1),
            language: z.object({
                policy: z.literal('deterministic'),
                code: z.literal('en'),
            }),
            components: z.array(kMessageRequestComponent),
        }),
    }),
]));

/**
 * Export the TypeScript type representing `kMessageRequest`.
 */
export type MessageRequest = z.infer<typeof kMessageRequest>;
