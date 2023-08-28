// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import symmetricDifference from 'set.prototype.symmetricdifference';

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
     * ID of the {type} that was added, which should be checked in the `updated` program.
     */
    id: number;
}

/**
 * Describes a removal from the program, of any kind.
 */
export interface ProgramRemoval {
    /**
     * The type of removal that was taken from the program.
     */
    type: 'activity' | 'location' | 'timeslot';

    /**
     * ID of the {type} that was removed, which should be checked in the `current` program.
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

    /**
     * Removals that were made from the program. These are all considered as major severity.
     */
    removals: ProgramRemoval[];
}

/**
 * Compares the `current` program against the `updated` one, and returns the changes that were made
 * between them. Additions are considered to be low severity, removals major severity, whereas
 * program updates have different severity levels based on what changed.
 */
export function comparePrograms(current: Program, updated: Program): ProgramComparison {
    const additions: ProgramAddition[] = [];
    const removals: ProgramRemoval[] = [];

    // ---------------------------------------------------------------------------------------------
    // Step 1: Gather IDs of entities in the current program
    // ---------------------------------------------------------------------------------------------

    const seenActivitiesInCurrentProgram = new Set();
    for (const currentActivity of current.activities)
        seenActivitiesInCurrentProgram.add(currentActivity.id);

    const seenLocationsInCurrentProgram = new Set();
    for (const currentLocation of current.locations)
        seenLocationsInCurrentProgram.add(currentLocation.id);

    const seenTimeslotsInCurrentProgram = new Set();
    for (const currentTimeslot of current.timeslots)
        seenTimeslotsInCurrentProgram.add(currentTimeslot.id);

    // ---------------------------------------------------------------------------------------------
    // Step 2: Gather IDs of entities in the updated program
    // ---------------------------------------------------------------------------------------------

    const seenActivitiesInUpdatedProgram = new Set();
    for (const updatedActivity of updated.activities) {
        seenActivitiesInUpdatedProgram.add(updatedActivity.id);
        // TODO: Process activity update
    }

    const seenLocationsInUpdatedProgram = new Set();
    for (const updatedLocation of updated.locations) {
        seenLocationsInUpdatedProgram.add(updatedLocation.id);
        // TODO: Process location update
    }

    const seenTimeslotsInUpdatedProgram = new Set();
    for (const updatedTimeslot of updated.timeslots) {
        seenTimeslotsInUpdatedProgram.add(updatedTimeslot.id);
        // TODO: Process timeslot update
    }

    // ---------------------------------------------------------------------------------------------
    // Step 3: Identify program additions and removals
    // ---------------------------------------------------------------------------------------------

    const addedOrRemovedActivities =
        symmetricDifference(seenActivitiesInCurrentProgram, seenActivitiesInUpdatedProgram);
    const addedOrRemovedLocations =
        symmetricDifference(seenLocationsInCurrentProgram, seenLocationsInUpdatedProgram);
    const addedOrRemovedTimeslots =
        symmetricDifference(seenTimeslotsInCurrentProgram, seenTimeslotsInUpdatedProgram);

    for (const id of addedOrRemovedActivities) {
        if (current.getActivity(id) === undefined)
            additions.push({ type: 'activity', id });
        else
            removals.push({ type: 'activity', id });
    }

    for (const id of addedOrRemovedLocations) {
        if (current.getLocation(id) === undefined)
            additions.push({ type: 'location', id });
        else
            removals.push({ type: 'location', id });
    }

    for (const id of addedOrRemovedTimeslots) {
        const currentProgramActivityId = current.getTimeslot(id)?.activityId;
        const updatedProgramActivityId = updated.getTimeslot(id)?.activityId;

        if (addedOrRemovedActivities.has(currentProgramActivityId || updatedProgramActivityId))
            continue;  // the entire activity was added or removed

        if (!currentProgramActivityId)
            additions.push({ type: 'timeslot', id });
        else
            removals.push({ type: 'timeslot', id });
    }

    return { additions, removals };
}
