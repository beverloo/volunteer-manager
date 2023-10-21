// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import type { NextRouterParams } from '@lib/NextRouterParams';

/**
 * The <ExportsPage> component displays exported information, providing the given `slug` is valid
 * and that it has not expired.
 */
export default async function ExportsPage(props: NextRouterParams<'slug'>) {
    // TODO: Check for existence & access
    // TODO: Render the different types of exports

    return (
        <>
            <p>
                This may be a data export.
            </p>
        </>
    )
}

export const metadata: Metadata = {
    title: 'Data export | AnimeCon Volunteer Manager',
};
