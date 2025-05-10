// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

/**
 * The display request page provides detailed access to an individual help request, however, when
 * the ID is missing we have no ability to show anything at all. Display a HTTP 404 error instead.
 */
export default async function DisplayRequestsPage() {
    notFound();
}
