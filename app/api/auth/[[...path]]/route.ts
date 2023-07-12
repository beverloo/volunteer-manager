// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '../../Action';

import { confirmIdentity, kConfirmIdentityDefinition } from '../confirmIdentity';
import { passwordReset, kPasswordResetDefinition } from '../passwordReset';
import { passwordResetRequest, kPasswordResetRequestDefinition } from '../passwordResetRequest';
import { passwordResetVerify, kPasswordResetVerifyDefinition } from '../passwordResetVerify';
import { signInPassword, kSignInPasswordDefinition } from '../signInPassword';
import { signOut, kSignOutDefinition } from '../signOut';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { path: string[] } };

/**
 * The /api/auth endpoint exposes the API for providing user authentication and associated
 * functionality, including registration, password reset and so on.
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<Response> {
    const action = Object.hasOwn(params, 'path') ? params.path.join('/') : null;
    switch (action) {
        case 'confirm-identity':
            return executeAction(request, kConfirmIdentityDefinition, confirmIdentity);
        case 'password-reset':
            return executeAction(request, kPasswordResetDefinition, passwordReset);
        case 'password-reset-request':
            return executeAction(request, kPasswordResetRequestDefinition, passwordResetRequest);
        case 'password-reset-verify':
            return executeAction(request, kPasswordResetVerifyDefinition, passwordResetVerify);
        case 'sign-in-password':
            return executeAction(request, kSignInPasswordDefinition, signInPassword);
        case 'sign-out':
            return executeAction(request, kSignOutDefinition, signOut);
    }

    return NextResponse.json({ success: false }, { status: 404 });
}
