// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Content } from '@lib/Content';
import { type EventData } from '@lib/Event';
import { type RegistrationInfo } from '../Registration';
import { type UserData } from '@app/lib/auth/UserData';

/**
 * Props accepted by the <ApplicationReceivedPage> page.
 */
export interface ApplicationReceivedPageProps {
    /**
     * The content that should be displayed on the confirmation page.
     */
    content?: Content;

    /**
     * The event for which data is being displayed on this page.
     */
    event: EventData;

    /**
     * Information about the user's existing registration.
     */
    registration: RegistrationInfo;

    /**
     * The user who is currently signed in. We require someone to be signed in when applying, as
     * it helps carry their participation information across multiple events.
     */
    user?: UserData;
}

/**
 * The <ApplicationReceivedPage> component confirms to a user that their application has been
 * retrieved by the team's leads and that it will be considered.
 */
export function ApplicationReceivedPage(props: ApplicationReceivedPageProps) {
    return <p>Hello, world.</p>
}