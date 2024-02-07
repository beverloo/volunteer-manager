// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type DashboardAreaGraphSeries, DashboardGraph } from '../DashboardGraph';
import { ScheduleType } from '@lib/database/Types';
import { Temporal, formatDate, isBefore, isAfter } from '@lib/Temporal';
import { computeColor } from '../ColorUtils';
import db, { tSchedule, tUsersEvents } from '@lib/database';

/**
 * How long should a single time bucket last for, in minutes?
 */
const kTimeBucketSizeMin = 30;

/**
 * How many time buckets should the volunteer be "resting" after a shift?
 */
const kRestingTimeBucketCount = 1;

/**
 * Type describing the contents for an individual time bucket.
 */
type TimeBucket = { available: number; shift: number; unavailable: number; };

/**
 * Graph that displays a time series for availability in a particular team during an event.
 */
export async function EventAvailabilityTimeSeriesGraph(props: { eventId: number; teamId: number }) {
    const dbInstance = db;
    const scheduleInfo = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tSchedule)
            .on(tSchedule.eventId.equals(tUsersEvents.eventId))
            .and(tSchedule.userId.equals(tUsersEvents.userId))
        .where(tUsersEvents.eventId.equals(props.eventId))
            .and(tUsersEvents.teamId.equals(props.teamId))
        .select({
            schedule: dbInstance.aggregateAsArray({
                type: tSchedule.scheduleType,
                start: tSchedule.scheduleTimeStart,
                end: tSchedule.scheduleTimeEnd,
            }),
        })
        .groupBy(tUsersEvents.userId)
        .executeSelectMany();

    const labels: string[] = [];
    const scheduleData: TimeBucket[] = [];

    let startTime = Temporal.ZonedDateTime.from('2099-12-12T23:59:59Z[UTC]');
    let endTime = Temporal.ZonedDateTime.from('2000-01-01T00:00:00Z[UTC]');

    // Step (1): Determine the earliest and latest time for the schedule to create buckets.
    for (const { schedule } of scheduleInfo) {
        for (const { start, end } of schedule) {
            if (isAfter(startTime, start))
                startTime = start;
            if (isBefore(endTime, end))
                endTime = end;
        }
    }

    // Step (2): Create empty time buckets between `startTime` and `endTime`.
    for (let t = startTime; isBefore(t, endTime); t = t.add({ minutes: kTimeBucketSizeMin })) {
        labels.push(formatDate(t, 'dd/H:mm'));
        scheduleData.push({
            available: 0,
            shift: 0,
            unavailable: 0,
        });
    }

    // Step (3): For each of the participating volunteers, populate availability in the buckets.
    for (const { schedule } of scheduleInfo) {
        let defaultState: keyof TimeBucket = 'unavailable';
        let restingBuckets: number = 0;

        for (let t = startTime; isBefore(t, endTime); t = t.add({ minutes: kTimeBucketSizeMin })) {
            const bucket =
                startTime.until(t, { largestUnit: 'minutes' }).minutes / kTimeBucketSizeMin;

            let activityToIncrement: keyof TimeBucket = defaultState;
            while (!!schedule.length) {
                if (isBefore(t, schedule[0].start))
                    break;  // unavailable
                else if (defaultState === 'unavailable')
                    defaultState = 'available';

                if (isAfter(t, schedule[0].end)) {
                    schedule.shift();
                    continue;
                }

                switch (schedule[0].type) {
                    case ScheduleType.Shift:
                        activityToIncrement = 'shift';
                        restingBuckets = kRestingTimeBucketCount;
                        break;

                    case ScheduleType.Unavailable:
                        activityToIncrement = 'unavailable';
                        break;

                    default:
                        throw new Error(`Unrecognised schedule type: ${schedule[0].type}`);
                }

                break;
            }

            if (activityToIncrement === 'available' && restingBuckets-- > 0)
                activityToIncrement = 'unavailable';

            scheduleData[bucket][activityToIncrement]++;
        }
    }

    // Step (5): Format the `scheduleData` in the format expected by <DashboardGraph>.
    const kCommonSettings = {
        area: true,
        curve: 'monotoneX',
        showMark: false,
        stack: 'total',
        type: 'line',
    } as const;

    const data: DashboardAreaGraphSeries = [
        {
            ...kCommonSettings,
            color: computeColor('success'),
            data: scheduleData.map(entry => entry.available),
            label: 'Available',
        },
        {
            ...kCommonSettings,
            color: computeColor('warning'),
            data: scheduleData.map(entry => entry.shift),
            label: 'Shift',
        },
        {
            ...kCommonSettings,
            color: computeColor('disabled'),
            data: scheduleData.map(entry => entry.unavailable),
            label: 'Unavailable',
        }
    ];

    return <DashboardGraph title="Volunteer availability" presentation="area" fullWidth
                           data={data} labels={labels} />;
}
