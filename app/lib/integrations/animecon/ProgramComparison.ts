// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Program } from './Program';

/**
 * The severity of a detected change in the program.
 */
export enum ProgramChangeSeverity {
    Major = 'Major',
    Minor = 'Minor',
    Low = 'Low',
}

/**
 * Describes an addition to the program, of any kind.
 */
export interface ProgramAddition {
    /**
     * The type of addition that was made to the program.
     */
    type: 'activity' | 'location' | 'timeslot';

    /**
     * ID of the activity that was added, which should be checked in the `updated` program.
     */
    id: number;
}

/**
 * The result of comparing two programs against one another.
 */
export interface ProgramComparison {
    /**
     * Additions that were made to the program. These are all considered as low severity.
     */
    additions: ProgramAddition[];
}

/**
 * Compares the `current` program against the `updated` one, and returns the changes that were made
 * between them. Additions are considered to be low severity, removals major severity, whereas
 * program updates have different severity levels based on what changed.
 */
export function comparePrograms(current: Program, updated: Program): ProgramComparison {
    const additions: ProgramAddition[] = [];

    const seenActivities = new Set();
    const seenLocations = new Set();
    const seenTimeslots = new Set();

    for (const currentActivity of current.activities) {
        seenActivities.add(currentActivity.id);
    }

    for (const currentLocation of current.locations) {
        seenLocations.add(currentLocation.id);
    }

    for (const currentTimeslot of current.timeslots) {
        seenTimeslots.add(currentTimeslot.id);
    }

    for (const updatedActivity of updated.activities) {
        if (seenActivities.has(updatedActivity.id))
            continue;  // the activity already existed

        additions.push({
            type: 'activity',
            id: updatedActivity.id,
        });
    }

    for (const updatedLocation of updated.locations) {
        if (seenLocations.has(updatedLocation.id))
            continue;  // the location has already been seen

        additions.push({
            type: 'location',
            id: updatedLocation.id,
        });
    }

    for (const updatedTimeslot of updated.timeslots) {
        if (seenTimeslots.has(updatedTimeslot.id))
            continue;  // the timeslot already existed

        if (!seenActivities.has(updatedTimeslot.activityId))
            continue;  // the entire activity is an addition

        additions.push({
            type: 'timeslot',
            id: updatedTimeslot.id,
        });
    }

    return { additions };
}
