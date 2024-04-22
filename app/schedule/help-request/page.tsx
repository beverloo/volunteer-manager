// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { redirect } from 'next/navigation';

/**
 * The <EventlessHelpRequestPage> component redirects the user back to the homepage. We can deal
 * with help requests, but the actual help request needs to be identified.
 */
export default async function EventlessHelpRequestPage() {
    redirect('/');
}
