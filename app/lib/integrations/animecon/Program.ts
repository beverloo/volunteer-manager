// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import util from 'util';
import zlib from 'zlib';

import type { Activity, Floor } from './ClientTypes';
import { DateTime } from '@lib/DateTime';

/**
 * Represents an activity that's part of the program.
 */
export interface ProgramActivity {
    /**
     * Unique ID of this activity which it can be safely referenced by.
     */
    id: number;

    /**
     * Name of this activity, as it can be presented in a user interface.
     */
    name: string;

    /**
     * Brief description of the activity, to give a quick ~few sentence overview of its goal.
     */
    description?: string;

    /**
     * URL of the activity, only when it has been specified in AnPlan.
     */
    url?: string;

    /**
     * Whether the activity is visible to the general public.
     */
    visible: boolean;
}

/**
 * Represents a floor that's part of the event's venue.
 */
export interface ProgramFloor {
    /**
     * Unique ID of this floor which it can be safely referenced by.
     */
    id: number;

    /**
     * Name of the floor, as it should be referred to in a user interface.
     */
    name: string;
}

/**
 * Represents a location that's part of the event's venue.
 */
export interface ProgramLocation {
    /**
     * Unique ID of this location which it can be safely referenced by.
     */
    id: number;

    /**
     * Name of the location, as it should be referred to in a user interface.
     */
    name: string;

    /**
     * Unique ID of the floor that this location is located in.
     */
    floorId: number;
}

/**
 * Represents a timeslot of an event that's part of the program.
 */
export interface ProgramTimeslot {
    /**
     * Unique ID of this timeslot which it can be safely referenced by.
     */
    id: number;

    /**
     * Unique ID of the activity which this timeslot is part of.
     */
    activityId: number;

    /**
     * Unique ID of the location in which this timeslot will be located.
     */
    locationId: number;

    /**
     * Date and time at which this timeslot will start. Inclusive.
     */
    startDate: DateTime;

    /**
     * Date and time at which this timeslot will end. Exclusive.
     */
    endDate: DateTime;
}

/**
 * The Program class is our intermediary representation of the AnimeCon program, which effectively
 * is a set of activities in a particular location on one or more floors. This class allows
 * efficient querying of any of the entities that exists within the program.
 */
export class Program {
    /**
     * Creates a new instance of the Program class based on the given `clientActivities` and the
     * `clientFloors`, which must have been obtained from the AnimeCon API Client.
     */
    static fromClient(clientActivities: Activity[], clientFloors: Floor[]): Program {
        const activities: ProgramActivity[] = [];
        const floors: ProgramFloor[] = [];
        const locations: ProgramLocation[] = [];
        const timeslots: ProgramTimeslot[] = [];

        // -----------------------------------------------------------------------------------------
        // Step 1: Import `clientFloors`
        // -----------------------------------------------------------------------------------------

        // TODO

        // -----------------------------------------------------------------------------------------
        // Step 2: Import `clientActivities`
        // -----------------------------------------------------------------------------------------

        const seenLocations = new Set();

        for (const clientActivity of clientActivities) {
            for (const clientTimeslot of clientActivity.timeslots) {
                if (!seenLocations.has(clientTimeslot.location.id)) {
                    seenLocations.add(clientTimeslot.location.id);
                    locations.push({
                        id: clientTimeslot.location.id,
                        name: clientTimeslot.location.name,
                        floorId: 0  // TODO
                    });
                }

                timeslots.push({
                    id: clientTimeslot.id,
                    activityId: clientActivity.id,
                    locationId: clientTimeslot.location.id,
                    startDate: DateTime.From(clientTimeslot.dateStartsAt),
                    endDate: DateTime.From(clientTimeslot.dateEndsAt),
                });
            }

            activities.push({
                id: clientActivity.id,
                name: clientActivity.title,
                description: clientActivity.description ?? undefined,
                url: clientActivity.url ?? undefined,
                visible: clientActivity.visible,
            });
        }

        // -----------------------------------------------------------------------------------------
        // Step 3: Verify that all references are available.
        // -----------------------------------------------------------------------------------------

        // TODO

        return new Program(activities, floors, locations, timeslots);
    }

    #activities: Map<number, ProgramActivity> = new Map;
    #floors: Map<number, ProgramFloor> = new Map;
    #locations: Map<number, ProgramLocation> = new Map;
    #timeslots: Map<number, ProgramTimeslot> = new Map;

    constructor(
        activities: ProgramActivity[], floors: ProgramFloor[], locations: ProgramLocation[],
        timeslots: ProgramTimeslot[])
    {
        for (const floor of floors)
            this.#floors.set(floor.id, floor);

        for (const location of locations)
            this.#locations.set(location.id, location);

        for (const activity of activities)
            this.#activities.set(activity.id, activity);

        for (const timeslot of timeslots)
            this.#timeslots.set(timeslot.id, timeslot);
    }

    /**
     * Gets an iterator that provides access to all activities that exist in the Program.
     */
    get activities(): IterableIterator<ProgramActivity> { return this.#activities.values(); }

    /**
     * Returns the activity with the given `activityId`, or `undefined` when it cannot be found.
     */
    getActivity(activityId: number): ProgramActivity | undefined {
        return this.#activities.get(activityId);
    }

    /**
     * Gets an iterator that provides access to all floors that exist in the program.
     */
    get floors(): IterableIterator<ProgramFloor> { return this.#floors.values(); }

    /**
     * Returns the floor with the given `floorId`, or `undefined` when it cannot be found.
     */
    getFloor(floorId: number): ProgramFloor | undefined {
        return this.#floors.get(floorId);
    }

    /**
     * Gets an iterator that provides access to all locations that exist in the program.
     */
    get locations(): IterableIterator<ProgramLocation> { return this.#locations.values(); }

    /**
     * Returns the location with the given `locationId`, or `undefined` when it cannot be found.
     */
    getLocation(locationId: number): ProgramLocation | undefined {
        return this.#locations.get(locationId);
    }

    /**
     * Gets an iterator that provides access to all timeslots that exist in the program.
     */
    get timeslots(): IterableIterator<ProgramTimeslot> { return this.#timeslots.values(); }

    /**
     * Returns the timeslot with the given `timeslotId`, or `undefined` when it cannot be found.
     */
    getTimeslot(timeslotId: number): ProgramTimeslot | undefined {
        return this.#timeslots.get(timeslotId);
    }
}

/**
 * Promisified version of the zlib deflate and inflate methods, which we use to compress the
 * serialized program formats to make them cheaper to store.
 */
const zlibDeflate = util.promisify(zlib.deflate);
const zlibInflate = util.promisify(zlib.inflate);

/**
 * Serializes the given `program` to a `Uint8Array` containing an undefined, serialized variant of
 * that program. The serialized program can later be deserialized using `deserializeProgram()`.
 */
export async function serializeProgram(program: Program, compress?: boolean): Promise<Uint8Array> {
    const serializedJson = JSON.stringify({
        activities: [ ...program.activities ],
        floors: [ ...program.floors ],
        locations: [ ...program.locations ],
        timeslots: [ ...program.timeslots ],

        version: 1,  // in case we ever want to add stability
    });

    return compress ? await zlibDeflate(serializedJson, { level: 7 })
                    : (new TextEncoder).encode(serializedJson);
}

/**
 * Deserializes the given `programData` to a new instance of a Program. The stored variant is
 * expected to have been created by `serializeProgram`, and various data checks are done.
 */
export async function deserializeProgram(programData: Uint8Array, uncompress?: boolean)
    : Promise<Program>
{
    const serializedJson =
        uncompress ? (await zlibInflate(programData)).toString()
                   : (new TextDecoder).decode(programData);

    const deserializedData = JSON.parse(serializedJson, (key: string, value: any) => {
        switch (key) {
            case 'startDate':
            case 'endDate':
                return DateTime.From(value);
            default:
                return value;
        }
    });

    if (typeof deserializedData !== 'object')
        throw new Error('Unable to deserialize the program: invalid JSON payload');

    if (deserializedData.version !== /* current version= */ 1)
        throw new Error('Unable to deserialize the program: invalid version');

    for (const requiredArray of [ 'activities', 'floors', 'locations', 'timeslots' ]) {
        if (!Object.hasOwn(deserializedData, requiredArray))
            throw new Error(`Unable to deserialize the program: missing ${requiredArray}`);
    }

    return new Program(
        deserializedData.activities,
        deserializedData.floors,
        deserializedData.locations,
        deserializedData.timeslots);
}
