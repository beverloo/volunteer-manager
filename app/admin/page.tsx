// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useSession } from '../lib/auth/useSession';

export default async function AdminPage() {
    const session = await useSession('not-found');

    return (
        <p>
            Hello, {session.id}!
        </p>
    );
}
