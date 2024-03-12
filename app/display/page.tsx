// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { ClientTest } from './ClientTest';

/**
 * The <DisplayPage> is the main page of the Display app, which powers the physical devices we will
 * position around the event's location. It's an 1280x800 pixel screen that we should assume can be
 * seen by volunteers and visitors alike.
 */
export default async function DisplayPage() {
    return (
        <ClientTest />
    );
}

export const metadata: Metadata = {
    title: 'AnimeCon Volunteering Teams | Display app',
};
