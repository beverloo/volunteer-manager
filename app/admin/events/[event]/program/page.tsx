// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

/**
 * The <ProgramPage> component is the main page of a festival's program. Because there is nothing to
 * show here per se, we display an error page instead.
 */
export default async function ProgramPage() {
    notFound();
}
