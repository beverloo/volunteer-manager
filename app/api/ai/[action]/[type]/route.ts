// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '@app/api/Action';

import { generatePrompt, kGeneratePromptDefinition } from '../../generatePrompt';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { action: string; type: string; } };

/**
 * POST /api/ai/generate/:type
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<Response> {
    switch (params.action) {
        case 'generate':
            return executeAction(request, kGeneratePromptDefinition, generatePrompt, params);
    }

    return NextResponse.json({ success: false }, { status: 404 });
}
