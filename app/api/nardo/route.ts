// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest } from 'next/server';
import { executeAction } from '@app/api/Action';

import { createAdvice, kCreateAdviceDefinition } from './createAdvice';
import { listAdvice, kListAdviceDefinition } from './listAdvice';

/**
 * GET /api/admin/nardo
 */
export async function GET(request: NextRequest): Promise<Response> {
    return executeAction(request, kListAdviceDefinition, listAdvice);
}

/**
 * POST /api/admin/nardo
 */
export async function POST(request: NextRequest): Promise<Response> {
    return executeAction(request, kCreateAdviceDefinition, createAdvice);
}
