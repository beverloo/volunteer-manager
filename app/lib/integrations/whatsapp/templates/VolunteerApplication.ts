// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { MessageRequest } from '../WhatsAppTypes';

/**
 * Parameters required to complete the "volunteer_application" template.
 */
export interface VolunteerApplicationRequest {
    /**
     * Phone number (+3100000000) of the recipient of the message.
     */
    to: string;

    /**
     * First name of the person who applied to join us as a volunteer.
     */
    firstName: string;

    /**
     * Last name of the person who applied to join us as a volunteer.
     */
    lastName: string;

    /**
     * Slug of the event (e.g. "2024" or "2024-classic") that they want to join.
     */
    eventSlug: string;

    /**
     * Name of the team (e.g. "Stewards" or "Festival Hosts") that they want to join.
     */
    teamName: string;

    /**
     * Slug of the team (e.g. "stewards.team") that they want to join.
     */
    teamSlug: string;
}

/**
 * Composes a message request for the "volunteer_application" template. The `params` will be added
 * to the right places in the template.
 */
export function composeVolunteerApplicationRequest(params: VolunteerApplicationRequest)
    : MessageRequest
{
    return {
        messaging_product: 'whatsapp',
        to: params.to,

        type: 'template',
        template: {
            name: 'volunteer_application',
            language: {
                policy: 'deterministic',
                code: 'en',
            },
            components: [
                {
                    type: 'header',
                    parameters: [
                        { type: 'text', text: params.firstName },
                    ],
                },
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: `${params.firstName} ${params.lastName}` },
                        { type: 'text', text: params.teamName },
                        { type: 'text', text: params.eventSlug },
                    ],
                },
                {
                    type: 'button',
                    sub_type: 'url',
                    index: 0,
                    parameters: [
                        {
                            type: 'text',
                            text: `${params.eventSlug}/${params.teamSlug}/applications`
                        },
                    ],
                }
            ],
        },
    };
}
