// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Temporal, formatDate } from '@lib/Temporal';
import db, { tEvents } from '@lib/database';

/**
 * Context that can be generated for a particular event.
 */
export interface EventContext {
    /**
     * Name of the event for which the prompt is being generated.
     */
    name: string;

    /**
     * Location of the event. May be missing in case that hasn't been announced yet.
     */
    location?: string;

    /**
     * Exact date and time on which the event will start.
     */
    startTime: Temporal.ZonedDateTime;

    /**
     * Exact date and time on which the event will finish.
     */
    endTime: Temporal.ZonedDateTime;
}

/**
 * Composes the given `context` in a series of individual strings, that can be added to the final
 * prompt context composition.
 */
export function composeEventContext(context: EventContext): string[] {
    const composition: string[] = [];

    const today = formatDate(Temporal.Now.zonedDateTimeISO('UTC'), 'MMMM D, YYYY');
    const start = formatDate(context.startTime, 'MMMM D, YYYY');
    const end = formatDate(context.endTime, 'MMMM D, YYYY');

    composition.push(`Today's date is ${today}.`);
    composition.push(
        `You are writing about ${context.name}, happening from ${start} to ${end}.`);

    if (context.location)
        composition.push(`The event takes place in ${context.location}.`);

    return composition;
}

/**
 * Generates context for the event identified by the given `event`, which is its unique slug used
 * to identify the context in the database and URLs.
 */
export async function generateEventContext(event: string): Promise<EventContext> {
    const eventInfo = await db.selectFrom(tEvents)
        .where(tEvents.eventSlug.equals(event))
        .select({
            name: tEvents.eventShortName,
            location: tEvents.eventLocation,
            startTime: tEvents.eventStartTime,
            endTime: tEvents.eventEndTime,
        })
        .executeSelectOne();

    return {
        name: eventInfo.name,
        location: eventInfo.location,
        startTime: eventInfo.startTime,
        endTime: eventInfo.endTime,
    };
}
