// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { color, type ColorCommonInstance } from 'd3-color';
import { interpolateRgbBasis } from 'd3-interpolate';

import db, { tActivities, tShifts, tShiftsCategories, tTeams } from '@lib/database';

/**
 * Type definition for a function that, given `t` (0-1), calculates the given colour on the scale.
 */
type ColourInterpolator = (t: number) => string;

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
     * Unique ID, environment and name of the team that this shift has been created for.
     */
    team: {
        id: number;
        environment: string;
        name: string;
    }

    /**
     * Unique ID and name of the activity this shift is linked with, if any.
     */
    activity?: {
        id: number;
        name: string;
    };

    /**
     * Number of hours that have been requested for this shifts & the number of individual shifts.
     */
    requested: {
        hours: number;
        shifts: number;
    };

    /**
     * Number of hours that have been scheduled for this shifts & number of individual shifts.
     */
    scheduled: {
        hours: number;
        shifts: number;
    };

    /**
     * Excitement level, between 0 and 1 inclusive, associated with this shift.
     */
    excitement: number;
}

/**
 * Reads the shifts for the given `eventId` from the database, and returns them as an array. Both
 * the shifts' order and colours will be resolved automatically.
 */
export async function getShiftsForEvent(eventId: number, festivalId: number): Promise<Shift[]> {
    const activitiesJoin = tActivities.forUseInLeftJoin();

    const results = await db.selectFrom(tShifts)
        .innerJoin(tShiftsCategories)
            .on(tShiftsCategories.shiftCategoryId.equals(tShifts.shiftCategoryId))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tShifts.teamId))
        .leftJoin(activitiesJoin)
                .on(activitiesJoin.activityId.equals(tShifts.shiftActivityId))
                    .and(activitiesJoin.activityFestivalId.equalsIfValue(festivalId))
                    .and(activitiesJoin.activityDeleted.isNull())
        .where(tShifts.eventId.equals(eventId))
        .select({
            id: tShifts.shiftId,
            category: {
                colour: tShiftsCategories.shiftCategoryColour,
                name: tShiftsCategories.shiftCategoryName,
            },
            name: tShifts.shiftName,
            team: {
                id: tTeams.teamId,
                environment: tTeams.teamEnvironment,
                name: tTeams.teamName,
            },
            activity: {
                id: activitiesJoin.activityId,
                name: activitiesJoin.activityTitle,
            },
            // TODO: requested
            // TODO: scheduled
            excitement: tShifts.shiftExcitement,
        })
        .orderBy(tShiftsCategories.shiftCategoryOrder, 'asc')
            .orderBy(tShifts.shiftName, 'asc')
        .executeSelectMany();

    // (1) Collect the teams and categories, enabling us to interpolate the right colours.
    const categories = new Map</* name= */ string, ColourInterpolator>;
    const categoryCounts = new Map<
        /* name= */ string, Map</* teamId= */ number,
                                [ /* total= */ number, /* remaining= */ number ]>>;

    for (const { category, team } of results) {
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

        return {
            ...shift,
            category: shift.category.name,
            colour: colourInterpolator(colourPosition),
            requested: { hours: 0, shifts: 0 },
            scheduled: { hours: 0, shifts: 0 },
        };
    });
}

/**
 * Creates a new colour interpolator for the given `range` colours, which must be one or more
 * colours separated by a comma. The interpolator will be created using d3.
 */
function createColourInterpolator(range: string): ColourInterpolator {
    const colours: ColorCommonInstance[] = [];
    for (const colour of range.split(',')) {
        const colourInstance = color(colour);
        if (!!colourInstance)
            colours.push(colourInstance);
    }

    switch (colours.length) {
        case 0:
            return interpolateRgbBasis([ '#f5f5f5', '#424242' ]);  // grey
        case 1:
            return () => colours[0].toString();
        default:
            return interpolateRgbBasis(colours);
    }
}
