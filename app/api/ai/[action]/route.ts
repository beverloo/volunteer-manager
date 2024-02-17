// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '@app/api/Action';

import { updateSettings, kUpdateAiSettingsDefinition } from '../updateSettings';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { action: string } };

/**
 * PUT /api/ai/settings
 */
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<Response> {
    switch (params.action) {
        case 'settings':
            return executeAction(request, kUpdateAiSettingsDefinition, updateSettings);
    }

    return NextResponse.json({ success: false }, { status: 404 });
}
