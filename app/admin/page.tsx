// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Metadata } from 'next';
import { headers } from 'next/headers';

import { useUser } from '../lib/auth/useUser';

export default async function AdminPage() {
    const user = await useUser('request-login');

    return (
        <p>
            Hello, {user.username}, you are on {headers().get('X-Request-Path')}.
        </p>
    );
}

export const metadata: Metadata = {
    title: 'Volunteer Administration',
};
