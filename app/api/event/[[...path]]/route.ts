// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '../../Action';

import { application, kApplicationDefinition } from '../application';
import { hotelPreferences, kHotelPreferencesDefinition } from '../hotelPreferences';
import { hotels, kHotelsDefinition } from '../hotels';
import { refundRequest, kRefundRequestDefinition } from '../refundRequest';
import { trainingPreferences, kTrainingPreferencesDefinition } from '../trainingPreferences';
import { trainings, kTrainingsDefinition } from '../trainings';

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { path: string[] } };

/**
 * The /api/event endpoint exposes APIs related to a particular event such as participation
 * applications and modifications, feedback reports, and so on.
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<Response> {
    const action = Object.hasOwn(params, 'path') ? params.path.join('/') : null;
    switch (action) {
        case 'application':
            return executeAction(request, kApplicationDefinition, application);
        case 'hotel-preferences':
            return executeAction(request, kHotelPreferencesDefinition, hotelPreferences);
        case 'hotels':
            return executeAction(request, kHotelsDefinition, hotels);
        case 'refund-request':
            return executeAction(request, kRefundRequestDefinition, refundRequest);
        case 'training-preferences':
            return executeAction(request, kTrainingPreferencesDefinition, trainingPreferences);
        case 'trainings':
            return executeAction(request, kTrainingsDefinition, trainings);
    }

    return NextResponse.json({ success: false }, { status: 404 });
}
