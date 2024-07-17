// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

/**
 * The <OutboxPage> component is the main page of the outbox mechanism, which can't be accessed
 * directly - rather, a messaging channel has to be selected by the user.
 */
export default async function OutboxPage() {
    notFound();
}
