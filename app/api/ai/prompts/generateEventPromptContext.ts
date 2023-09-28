// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { dayjs } from '@lib/DateTime';
import db, { tEvents } from '@lib/database';

/**
 * Context that can be generated for a particular event.
 */
export interface EventPromptContext {
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
    startTime: dayjs.Dayjs;

    /**
     * Exact date and time on which the event will finish.
     */
    endTime: dayjs.Dayjs;
}

/**
 * Composes the given `context` in a series of individual strings, that can be added to the final
 * prompt context composition.
 */
export function composeEventPromptContext(context: EventPromptContext): string[] {
    const composition: string[] = [];

    const today = dayjs().format('MMMM D, YYYY');
    const start = context.startTime.format('MMMM D, YYYY');
    const end = context.endTime.format('MMMM D, YYYY');

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
export async function generateEventPromptContext(event: string): Promise<EventPromptContext> {
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
        startTime: dayjs(eventInfo.startTime),
        endTime: dayjs(eventInfo.endTime),
    };
}
