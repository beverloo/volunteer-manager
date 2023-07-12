// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '../../Action';

import { confirmIdentity, kConfirmIdentityDefinition } from '../confirmIdentity';
import { passwordReset, kPasswordResetDefinition } from '../passwordReset';
import { passwordResetRequest, kPasswordResetRequestDefinition } from '../passwordResetRequest';
import { passwordResetVerify, kPasswordResetVerifyDefinition } from '../passwordResetVerify';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { path: string[] } };

/**
 * The /api/auth endpoint exposes the API for providing user authentication and associated
 * functionality, including registration, password reset and so on.
 */
export async function POST(nextRequest: NextRequest, { params }: RouteParams): Promise<Response> {
    const action = Object.hasOwn(params, 'path') ? params.path.join('/') : null;
    switch (action) {
        case 'confirm-identity':
            return executeAction(nextRequest, kConfirmIdentityDefinition, confirmIdentity);
        case 'password-reset':
            return executeAction(nextRequest, kPasswordResetDefinition, passwordReset);
        case 'password-reset-request':
            return executeAction(
                nextRequest, kPasswordResetRequestDefinition, passwordResetRequest);
        case 'password-reset-verify':
            return executeAction(nextRequest, kPasswordResetVerifyDefinition, passwordResetVerify);
    }

    return NextResponse.json({ success: false }, { status: 404 });
}
