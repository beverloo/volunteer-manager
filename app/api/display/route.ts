// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest } from 'next/server';
import { z } from 'zod';

import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { executeAction, noAccess, type ActionProps } from '../Action';
import { readSettings } from '@lib/Settings';
import { getDisplayIdFromHeaders, writeDisplayIdToHeaders } from '@lib/auth/DisplaySession';
import db, { tActivitiesLocations, tDisplays, tEvents } from '@lib/database';

/**
 * Interface definition for the Display API, exposed through /api/display.
 */
const kDisplayDefinition = z.object({
    request: z.object({ /* no input is required */ }),
    response: z.object({
        /**
         * Identifier of the display, through which it can be visually identified.
         */
        identifier: z.string(),

        /**
         * Label that should be shown on the display. Expected to make sense to humans.
         */
        label: z.string(),

        /**
         * Optional link to the development environment.
         */
        devEnvironment: z.string().optional(),

        /**
         * Whether the device should be locked.
         */
        locked: z.boolean(),

        /**
         * Whether the device has been fully provisioned and is ready for use.
         */
        provisioned: z.boolean(),

        /**
         * Timezone in which the display operates. Will affect the local time.
         */
        timezone: z.string(),

        /**
         * How frequently should the display check in? Indicated in milliseconds.
         */
        updateFrequencyMs: z.number(),
    }),
});

export type DisplayDefinition = ApiDefinition<typeof kDisplayDefinition>;

type Request = ApiRequest<typeof kDisplayDefinition>;
type Response = ApiResponse<typeof kDisplayDefinition>;

/**
 * Generates an identifier for the display based on a limited alphabet, optimised for clear reading.
 */
function generateDisplayIdentifier(length: number): string {
    const kIdentifierAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';  // no "I" or "O"

    let identifier = '';
    for (let character = 0; character < length; ++character) {
        identifier += kIdentifierAlphabet.charAt(
            Math.floor(Math.random() * kIdentifierAlphabet.length));
    }

    return identifier;
}

/**
 * API through which displays retrieve their context. Each display will be uniquely identified with
 * an autogenerated code, after which it has to be provisioned in our administration area.
 */
async function display(request: Request, props: ActionProps): Promise<Response> {
    if (!props.ip)
        noAccess();

    const settings = await readSettings([
        'display-check-in-rate-seconds',
        'display-dev-environment-link',
    ]);

    const updateFrequencySeconds = settings['display-check-in-rate-seconds'] ?? 300;
    const updateFrequencyMs = Math.max(10, updateFrequencySeconds) * 1000;

    // ---------------------------------------------------------------------------------------------
    // Step 1: Ensure that the device that's checking in is represented in our system
    // ---------------------------------------------------------------------------------------------

    let displayId: number | undefined = await getDisplayIdFromHeaders(props.requestHeaders);
    if (!!displayId) {
        const dbInstance = db;
        const affectedRows = await dbInstance.update(tDisplays)
            .set({
                displayCheckIn: dbInstance.currentZonedDateTime(),
                displayCheckInIp: props.ip,
            })
            .where(tDisplays.displayId.equals(displayId))
                .and(tDisplays.displayDeleted.isNull())
            .executeUpdate();

        if (!affectedRows)
            displayId = /* reset= */ undefined;
    }

    if (!displayId) {
        const dbInstance = db;
        displayId = await dbInstance.insertInto(tDisplays)
            .set({
                displayIdentifier: generateDisplayIdentifier(/* length= */ 4),
                displayCheckIn: dbInstance.currentZonedDateTime(),
                displayCheckInIp: props.ip,
                displayLocked: /* true= */ 1,
            })
            .returningLastInsertedId()
            .executeInsert();

        await writeDisplayIdToHeaders(props.responseHeaders, displayId);
    }

    // ---------------------------------------------------------------------------------------------
    // Step 2: Read static information that should be shown on the display
    // ---------------------------------------------------------------------------------------------

    const activitiesLocationsJoin = tActivitiesLocations.forUseInLeftJoin();
    const eventsJoin = tEvents.forUseInLeftJoin();

    const configuration = await db.selectFrom(tDisplays)
        .leftJoin(activitiesLocationsJoin)
            .on(activitiesLocationsJoin.locationId.equals(tDisplays.displayLocationId))
        .leftJoin(eventsJoin)
            .on(eventsJoin.eventId.equals(tDisplays.displayEventId))
        .where(tDisplays.displayId.equals(displayId))
        .select({
            identifier: tDisplays.displayIdentifier,
            label: tDisplays.displayLabel,
            locked: tDisplays.displayLocked.equals(/* true= */ 1),
            timezone: eventsJoin.eventTimezone,

            // Event information:
            eventId: eventsJoin.eventId,

            // Location information:
            locationId: activitiesLocationsJoin.locationId,
        })
        .executeSelectOne();

    return {
        identifier: configuration.identifier,
        label: configuration.label ?? 'AnimeCon Display',
        devEnvironment: settings['display-dev-environment-link'],
        locked: configuration.locked,
        provisioned: !!configuration.eventId && !!configuration.locationId,
        timezone: configuration.timezone ?? 'Europe/Amsterdam',
        updateFrequencyMs,
    };
}

// The /api/display route only provides a single API - call it straight away.
export const GET = (request: NextRequest) => executeAction(request, kDisplayDefinition, display);

export const dynamic = 'force-dynamic';
