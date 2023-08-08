// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Metadata } from 'next';

import { default as TopLevelLayout } from './TopLevelLayout';

export default async function AdminPage() {
    return (
        <TopLevelLayout>
            Dashboard
        </TopLevelLayout>
    );
}

export const metadata: Metadata = {
    title: 'Volunteer Administration',
};
