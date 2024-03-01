// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { redirect } from 'next/navigation';

/**
 * The <EventlessSchedulePage> component redirects the user back to the homepage. Schedules can only
 * be accessed for a specific event, so the event-less page is deliberately disabled.
 */
export default async function EventlessSchedulePage() {
    redirect('/');
}
