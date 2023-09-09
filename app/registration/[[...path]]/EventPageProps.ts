// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Content } from '@lib/Content';
import type { Environment } from '@lib/Environment';
import type { Event } from '@lib/Event';
import type { Registration } from '@lib/Registration';
import type { User } from '@lib/auth/User';

/**
 * Canonical props accepted by the event-related server components.
 */
export interface EventPageProps<UserRequired extends boolean = false> {
    /**
     * The content that should be shown on the page, if any.
     */
    content?: Content;

    /**
     * The environment for which the page is being loaded.
     */
    environment: Environment;

    /**
     * The event for which this page is being shown.
     */
    event: Event;

    /**
     * The full path that was requested by the user.
     */
    path: string[];

    /**
     * The registration owned by the signed in `user`, if any.
     */
    registration: UserRequired extends true ? Registration : Registration | undefined;

    /**
     * The user for whom this page is being loaded, if any.
     */
    user: UserRequired extends true ? User : User | undefined;
}

/**
 * Type of a server component handler for one of the event pages.
 */
export type EventPageFn =
    ((props: EventPageProps<true>) => Promise<JSX.Element>) |
    ((props: EventPageProps<false>) => Promise<JSX.Element>);
