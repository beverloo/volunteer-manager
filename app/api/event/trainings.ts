// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { Privilege, can } from '@lib/auth/Privileges';
import { dayjs } from '@lib/DateTime';
import db, { tEvents, tTrainings } from '@lib/database';

/**
 * Interface definition for the Trainings API, exposed through /api/event/trainings.
 */
export const kTrainingsDefinition = z.object({
    request: z.object({
        /**
         * Unique slug of the event for which to fetch training information.
         */
        event: z.string(),
    }),
    response: z.strictObject({
        /**
         * The training sessions which have availability for this event.
         */
        trainings: z.array(z.string()),
    }),
});

export type TrainingsDefinition = z.infer<typeof kTrainingsDefinition>;

type Request = TrainingsDefinition['request'];
type Response = TrainingsDefinition['response'];

/**
 * API through which visitors can retrieve information about the trainings available for an event.
 */
export async function trainings(request: Request, props: ActionProps): Promise<Response> {
    const configuration = await db.selectFrom(tTrainings)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tTrainings.eventId))
            .and(tEvents.eventSlug.equals(request.event))
        .where(tTrainings.trainingVisible.equals(/* true= */ 1))
        .select({
            published: tEvents.publishTrainings,
            timezone: tEvents.eventTimezone,

            start: tTrainings.trainingStart,
            end: tTrainings.trainingEnd,
        })
        .orderBy('start', 'asc')
        .executeSelectMany();

    const trainings: Response['trainings'] = [];
    for (const row of configuration) {
        if (!row.published && !can(props.user, Privilege.EventTrainingManagement))
            continue;  // this `row` has not yet been published

        const date = dayjs.utc(row.start).tz(row.timezone).format('dddd, MMMM D');
        const start = dayjs.utc(row.start).tz(row.timezone).format('H:mm');
        const end = dayjs.utc(row.end).tz(row.timezone).format('H:mm');

        trainings.push(`${date}, from ${start} until ${end}`);
    }

    return { trainings };
}
