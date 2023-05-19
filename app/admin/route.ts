// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';

import { AuthenticatedUser } from '../lib/auth/AuthenticatedUser';
import { useSession } from '../lib/auth/useSession';
import { useUser } from '../lib/auth/useUser';

export async function GET(request: NextRequest) {
    const response = NextResponse.json({ yo: 'ho' });

    const user = await useUser(request, response);
    if (!user) {
        const response = NextResponse.json({ user: false });
        const session = await useSession(request, response);  // eslint-disable-line

        await AuthenticatedUser.authenticate(session, /* userId= */ 1);

        return response;
    }

    return NextResponse.json({ user: user.username });
}
