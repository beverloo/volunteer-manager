// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import symmetricDifference from 'set.prototype.symmetricdifference';

import { DateTime } from '@lib/DateTime';
import type { ProgramActivity, ProgramFloor, ProgramLocation, ProgramTimeslot, Program }
    from './Program';

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
 * The severity of a detected change in the program.
 */
export enum ProgramUpdateSeverity {
    Major = 2,
    Minor = 1,
    Low = 0,
}

/**
 * Describes an update that happened in the program, of any kind.
 */
export interface ProgramUpdate {
    /**
     * The type of update that has taken place in the program.
     */
    type: 'activity' | 'location' | 'timeslot';

    /**
     * ID of the {type} that was updated, which can be compared between the `current` and the
     * `updated` programs.
     */
    id: number;

    /**
     * Array containing each field in the {type} that have been updated.
     */
    fields: string[];

    /**
     * Severity of the change, based on the affected `fields`.
     */
    severity: ProgramUpdateSeverity;
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
     * Updates that were made across various entities in the program. Different severities.
     */
    updates: ProgramUpdate[];

    /**
     * Removals that were made from the program. These are all considered as major severity.
     */
    removals: ProgramRemoval[];
}

/**
 * Defines the type of signature of a record containing the update severities of fields of <T>.
 */
type SeverityRecord<T> = { [k in keyof T]: ProgramUpdateSeverity };

/**
 * Associated severities of updates made to program activities.
 */
const kActivityUpdateSeverities: SeverityRecord<Omit<ProgramActivity, 'id'>> = {
    name: ProgramUpdateSeverity.Low,
    description: ProgramUpdateSeverity.Low,
    url: ProgramUpdateSeverity.Low,
    visible: ProgramUpdateSeverity.Minor,
};

/**
 * Associated severities of updates made to program locations.
 */
const kLocationUpdateSeverities: SeverityRecord<Omit<ProgramLocation, 'id'>> = {
    name: ProgramUpdateSeverity.Low,
    floorId: ProgramUpdateSeverity.Low,
};

/**
 * Associated severities of updates made to program timeslots.
 */
const kTimeslotUpdateSeverities: SeverityRecord<Omit<ProgramTimeslot, 'id'>> = {
    activityId: ProgramUpdateSeverity.Low,
    locationId: ProgramUpdateSeverity.Minor,
    startDate: ProgramUpdateSeverity.Major,
    endDate: ProgramUpdateSeverity.Major,
};

/**
 * Compares `current` to `updated`, where detected changes will be flagged with a severity of the
 * associated entry in the `fieldSeverities` record.
 */
function compare<T>(current: T, updated: T, fieldSeverities: SeverityRecord<T>)
    : Omit<ProgramUpdate, 'type' | 'id'> | undefined
{
    let highestSeverity = ProgramUpdateSeverity.Low;
    const fields = [];

    for (const [ field, severity ] of Object.entries(fieldSeverities)) {
        let equal: boolean;

        switch (field) {
            case 'startDate':
            case 'endDate':
                equal = (current[field as keyof T] as DateTime).isSame(
                    updated[field as keyof T] as DateTime);
                break;

            default:
                equal = current[field as keyof T] === updated[field as keyof T];
                break;
        }

        if (!equal) {
            highestSeverity = Math.max(highestSeverity, severity as ProgramUpdateSeverity);
            fields.push(field);
        }
    }

    return fields.length ? { fields, severity: highestSeverity } : undefined;
}

/**
 * Compares the `current` program against the `updated` one, and returns the changes that were made
 * between them. Additions are considered to be low severity, removals major severity, whereas
 * program updates have different severity levels based on what changed.
 *
 * This comparison carefully uses set and set operations to minimise programmatic complexity of
 * running the comparison, resulting in an amortized time complexity of O(n+k) plus the cost of
 * comparisons on individual fields - which will generally end up doing string comparisons.
 */
export function comparePrograms(current: Program, updated: Program): ProgramComparison {
    const additions: ProgramAddition[] = [];
    const updates: ProgramUpdate[] = [];
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

        const currentActivity = current.getActivity(updatedActivity.id);
        if (!currentActivity)
            continue;  // the |updatedActivity| did not exist in the |current| program

        const partialUpdate = compare(currentActivity, updatedActivity, kActivityUpdateSeverities);
        if (partialUpdate)
            updates.push({ type: 'activity', id: updatedActivity.id, ...partialUpdate });
    }

    const seenLocationsInUpdatedProgram = new Set();
    for (const updatedLocation of updated.locations) {
        seenLocationsInUpdatedProgram.add(updatedLocation.id);

        const currentLocation = current.getLocation(updatedLocation.id);
        if (!currentLocation)
            continue;  // the |updatedLocation| did not exist in the |current| program

        const partialUpdate = compare(currentLocation, updatedLocation, kLocationUpdateSeverities);
        if (partialUpdate)
            updates.push({ type: 'location', id: updatedLocation.id, ...partialUpdate });
    }

    const seenTimeslotsInUpdatedProgram = new Set();
    for (const updatedTimeslot of updated.timeslots) {
        seenTimeslotsInUpdatedProgram.add(updatedTimeslot.id);

        const currentTimeslot = current.getTimeslot(updatedTimeslot.id);
        if (!currentTimeslot)
            continue;  // the |updatedTimeslot| did not exist in the |current| program

        const partialUpdate = compare(currentTimeslot, updatedTimeslot, kTimeslotUpdateSeverities);
        if (partialUpdate)
            updates.push({ type: 'timeslot', id: updatedTimeslot.id, ...partialUpdate });
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

    return { additions, updates, removals };
}
