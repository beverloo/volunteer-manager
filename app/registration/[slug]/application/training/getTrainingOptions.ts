// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { dayjs } from '@lib/DateTime';
import db, { tEvents, tTrainings } from '@lib/database';

/**
 * Returns a list of the available training options in which the volunteer can participate.
 */
export async function getTrainingOptions(eventId: number) {
    const trainings = await db.selectFrom(tTrainings)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tTrainings.eventId))
        .where(tTrainings.eventId.equals(eventId))
            .and(tTrainings.trainingVisible.equals(/* true= */ 1))
        .select({
            id: tTrainings.trainingId,

            timezone: tEvents.eventTimezone,
            trainingStart: tTrainings.trainingStart,
            trainingEnd: tTrainings.trainingEnd,
        })
        .executeSelectMany();

    return trainings.map(training => {
        const date = training.trainingStart.tz(training.timezone).format('dddd, MMMM D');

        const start = training.trainingStart.tz(training.timezone).format('H:mm');
        const end = training.trainingEnd.tz(training.timezone).format('H:mm');

        return {
            id: training.id,
            label: `${date}, from ${start} to ${end}`,
        };
    });
}
