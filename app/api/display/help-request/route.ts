// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest } from 'next/server';
import { z } from 'zod';

import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { DisplayHelpRequestStatus, DisplayHelpRequestTarget, SubscriptionType } from '@lib/database/Types';
import { Publish } from '@lib/subscriptions';
import { executeAction, noAccess, type ActionProps } from '../../Action';
import { getDisplayIdFromHeaders } from '@lib/auth/DisplaySession';
import { readSettings } from '@lib/Settings';
import db, { tActivitiesLocations, tDisplays, tDisplaysRequests, tEvents } from '@lib/database';
import { kTargetToTypeId } from '@lib/subscriptions/drivers/HelpDriver';

/**
 * Interface definition for the Display API, exposed through /api/display/help-request.
 */
const kHelpRequestDefinition = z.object({
    request: z.object({
        /**
         * To whom should the help request be directed?
         */
        target: z.nativeEnum(DisplayHelpRequestTarget),
    }),
    response: z.object({
        /**
         * Whether the help request was distributed among volunteers.
         */
        success: z.boolean(),

        /**
         * Human readable error message that explains what went wrong.
         */
        error: z.string().optional(),
    }),
});

export type HelpRequestDefinition = ApiDefinition<typeof kHelpRequestDefinition>;

/**
 * Maps a given `DisplayHelpRequestTarget` target to a textual subject to use in a message. Use
 * generally looks like: "...requested help with [value]".
 */
const kTargetToSubject: { [k in DisplayHelpRequestTarget]: string } = {
    [DisplayHelpRequestTarget.Crew]: 'a volunteering matter',
    [DisplayHelpRequestTarget.Nardo]: 'a Del a Rie advice query',
    [DisplayHelpRequestTarget.Stewards]: 'a steward-related matter',
};

type Request = ApiRequest<typeof kHelpRequestDefinition>;
type Response = ApiResponse<typeof kHelpRequestDefinition>;

/**
 * API through which displays can request help. The identified display must be a provisioned display
 * associated with a particular event. The request will be published to subscribed volunteers.
 */
async function helpRequest(request: Request, props: ActionProps): Promise<Response> {
    if (!props.ip)
        noAccess();

    const displayId: number | undefined = await getDisplayIdFromHeaders(props.requestHeaders);
    if (!displayId)
        noAccess();

    const dbInstance = db;
    const configuration = await dbInstance.selectFrom(tDisplays)
        .innerJoin(tActivitiesLocations)
            .on(tActivitiesLocations.locationId.equals(tDisplays.displayLocationId))
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tDisplays.displayEventId))
        .where(tDisplays.displayId.equals(displayId))
        .select({
            eventId: tEvents.eventId,

            helpRequestStatus: tDisplays.displayHelpRequestStatus,
            label: tDisplays.displayLabel,

            location: tActivitiesLocations.locationDisplayName.valueWhenNull(
                tActivitiesLocations.locationName),
        })
        .executeSelectNoneOrOne();

    if (!configuration)
        return { success: false, error: 'The display has not been provisioned yet' };

    const settings = await readSettings([
        'display-request-advice',
        'display-request-help',
    ]);

    if (!settings['display-request-help'])
        return { success: false, error: 'The "help request" feature is not available' };

    if (!settings['display-request-advice'] && request.target === DisplayHelpRequestTarget.Nardo)
        return { success: false, error: 'Del a Rie Advies is currently not available for advice' };

    if (!Object.hasOwn(kTargetToTypeId, request.target))
        return { success: false, error: 'Cannot determine what type of help is required' };

    const insertId = await dbInstance.transaction(async () => {
        const insertId = await dbInstance.insertInto(tDisplaysRequests)
            .set({
                displayId,
                requestEventId: configuration.eventId,
                requestReceivedDate: dbInstance.currentZonedDateTime(),
                requestReceivedTarget: request.target,
            })
            .returningLastInsertedId()
            .executeInsert();

        await dbInstance.update(tDisplays)
            .set({
                displayHelpRequestStatus: DisplayHelpRequestStatus.Pending,
            })
            .where(tDisplays.displayId.equals(displayId))
            .executeUpdate();

        return insertId;
    });

    await Publish({
        type: SubscriptionType.Help,
        typeId: kTargetToTypeId[request.target],
        message: {
            requestId: insertId,
            location: configuration.label || configuration.location,
            subject: kTargetToSubject[request.target],
        },
    });

    return { success: !!insertId };
}

// The /api/display/help-request route only provides a single API - call it straight away.
export const POST =
    (request: NextRequest) => executeAction(request, kHelpRequestDefinition, helpRequest);

export const dynamic = 'force-dynamic';
