// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { WelcomePage } from './WelcomePage';
import { useUser } from './lib/auth/useUser';

export default async function RootPage() {
    const user = await useUser('ignore');

    return (
        <WelcomePage user={user?.toUserData()} />
    );
}
