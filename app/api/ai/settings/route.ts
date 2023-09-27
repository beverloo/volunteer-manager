// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRequest } from 'next/server';
import { executeAction } from '@app/api/Action';

import { updateSettings, kUpdateSettingsDefinition } from '../updateSettings';

/**
 * PUT /api/ai/settings
 */
export async function PUT(request: NextRequest): Promise<Response> {
    return executeAction(request, kUpdateSettingsDefinition, updateSettings);
}
