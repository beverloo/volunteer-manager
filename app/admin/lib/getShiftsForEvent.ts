// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { RegistrationStatus } from '@lib/database/Types';
import { Temporal } from '@lib/Temporal';
import { createColourInterpolator, type ColourInterpolator } from './createColourInterpolator';
import db, { tActivities, tSchedule, tShifts, tShiftsCategories, tTeams, tUsersEvents }
    from '@lib/database';

import { kShiftDemand } from '@app/api/admin/event/shifts/[[...id]]/demand';

/**
 * Information representing a shift.
 */
interface Shift {
    /**
     * Unique ID through which the shift is represented in the database.
     */
    id: number;

    /**
     * Resolved colour (as an HTML RGB colour value) this shift should be represented with.
     */
    colour: string;

    /**
     * Name of the category that this shift is part of.
     */
    category: string;

    /**
     * Name of the shift. Generally the name of the event it represents.
     */
    name: string;

    /**
     * Unique ID, name and slug of the team that this shift has been created for.
     */
    team: {
        id: number;
        name: string;
        slug: string;
    }

    /**
     * Unique ID and name of the activity this shift is linked with, if any.
     */
    activity?: {
        id: number;
        name: string;
    };

    /**
     * Number of minutes that have been requested for this shifts.
     */
    demandInMinutes: number;

    /**
     * Number of hours that have been scheduled for this shifts.
     */
    scheduledInMinutes: number;

    /**
     * Description that should be shared with volunteers regarding this shift.
     */
    description?: string;

    /**
     * Excitement level, between 0 and 1 inclusive, associated with this shift.
     */
    excitement: number;
}

/**
 * Calculates the number of minutes of demand scheduled for this shift, based on the given `demand`,
 * which must validate according to the `kShiftDemand` type.
 */
function calculateDemandMinutes(demand?: string): number {
    if (!demand || demand.length < 4)
        return 0;  // no demand has been defined

    let totalMinutes = 0;
    try {
        const demandArray = JSON.parse(demand);
        const normalizedDemandArray = kShiftDemand.parse(demandArray);

        for (const { start, end, volunteers } of normalizedDemandArray) {
            const startInstant = Temporal.Instant.from(start);
            const endInstant = Temporal.Instant.from(end);

            const difference = startInstant.until(endInstant, { largestUnit: 'minutes' });
            totalMinutes += difference.minutes * volunteers;
        }
    } catch (error: any) {
        console.error('Invalid demand value seen in a serialised shift.');
    }

    return totalMinutes;
}

/**
 * Reads the shifts for the given `eventId` from the database, and returns them as an array. Both
 * the shifts' order and colours will be resolved automatically.
 */
export async function getShiftsForEvent(eventId: number, festivalId: number): Promise<Shift[]> {
    const activitiesJoin = tActivities.forUseInLeftJoin();
    const scheduleJoin = tSchedule.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    const dbInstance = db;
    const scheduleDurationMinuteFragment = dbInstance.fragmentWithType('int', 'required').sql`
        TIMESTAMPDIFF(MINUTE, ${scheduleJoin.scheduleTimeStart}, ${scheduleJoin.scheduleTimeEnd})`;

    const results = await dbInstance.selectFrom(tShifts)
        .innerJoin(tShiftsCategories)
            .on(tShiftsCategories.shiftCategoryId.equals(tShifts.shiftCategoryId))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tShifts.teamId))
        .leftJoin(activitiesJoin)
                .on(activitiesJoin.activityId.equals(tShifts.shiftActivityId))
                    .and(activitiesJoin.activityFestivalId.equalsIfValue(festivalId))
                    .and(activitiesJoin.activityDeleted.isNull())
        .leftJoin(scheduleJoin)
            .on(scheduleJoin.shiftId.equals(tShifts.shiftId))
                .and(scheduleJoin.scheduleDeleted.isNull())
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.userId.equals(scheduleJoin.userId))
                .and(usersEventsJoin.eventId.equals(scheduleJoin.eventId))
                .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .where(tShifts.eventId.equals(eventId))
            .and(tShifts.shiftDeleted.isNull())
        .select({
            id: tShifts.shiftId,
            category: {
                colour: tShiftsCategories.shiftCategoryColour,
                name: tShiftsCategories.shiftCategoryName,
            },
            name: tShifts.shiftName,
            team: {
                id: tTeams.teamId,
                name: tTeams.teamName,
                slug: tTeams.teamSlug,
            },
            activity: {
                id: activitiesJoin.activityId,
                name: activitiesJoin.activityTitle,
            },
            colour: tShifts.shiftColour,
            demand: tShifts.shiftDemand,
            scheduledInMinutes: dbInstance.sum(scheduleDurationMinuteFragment),
            description: tShifts.shiftDescription,
            excitement: tShifts.shiftExcitement,
        })
        .groupBy(tShifts.shiftId)
        .orderBy(tShiftsCategories.shiftCategoryOrder, 'asc')
            .orderBy(tShifts.shiftName, 'asc')
        .executeSelectMany();

    // (1) Collect the teams and categories, enabling us to interpolate the right colours.
    const categories = new Map</* name= */ string, ColourInterpolator>;
    const categoryCounts = new Map<
        /* name= */ string, Map</* teamId= */ number,
                                [ /* total= */ number, /* remaining= */ number ]>>;

    for (const { category, colour, team } of results) {
        if (!!colour)
            continue;  // this result has a hardcoded colour

        if (!categories.has(category.name))
            categories.set(category.name, createColourInterpolator(category.colour));

        if (!categoryCounts.has(category.name))
            categoryCounts.set(category.name, new Map);

        const teamCounts = categoryCounts.get(category.name)!;

        const currentCounts = teamCounts.get(team.id);
        if (!currentCounts)
            teamCounts.set(team.id, [ /* total= */ 1, /* remaining= */ 1 ]);
        else
            teamCounts.set(team.id, [ currentCounts[0] + 1, currentCounts[1] + 1 ]);
    }

    // (2) Process the `results` to associate them with the right colour.
    return results.map(shift => {
        let colour = shift.colour;
        if (!colour && categoryCounts.has(shift.category.name)) {
            const teamCounts = categoryCounts.get(shift.category.name)!;

            const [ total, remaining ] = teamCounts.get(shift.team.id)!;
            teamCounts.set(shift.team.id, [ total, remaining - 1 ]);

            let range: { min: number; max: number };
            switch (total) {
                case 1:
                    range = { min: 0.7, max: 0.7 };
                    break;
                case 2:
                    range = { min: 0.4, max: 0.7 };
                    break;
                case 3:
                    range = { min: 0.2, max: 0.8 };
                    break;
                default:
                    range = { min: 0, max: 1 };
                    break;
            }

            const colourInterpolator = categories.get(shift.category.name)!;
            const colourPosition =
                total === 1
                    ? /* fixed point= */ 0.7
                    : range.min + ((range.max - range.min) / (total - 1)) * (total - remaining);

            colour = colourInterpolator(colourPosition);
        }

        return {
            ...shift,
            category: shift.category.name,
            colour: colour!,
            demandInMinutes: calculateDemandMinutes(shift.demand),
            scheduledInMinutes: shift.scheduledInMinutes ?? 0,
        };
    });
}
