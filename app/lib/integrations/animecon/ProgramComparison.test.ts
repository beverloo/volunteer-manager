// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Activity, Floor, Location, Timeslot } from './ClientTypes';
import { Program } from './Program';
import { comparePrograms } from './ProgramComparison';

type PartialWithRequiredId<T> = Partial<T> & { id: number};

/**
 * Multiplier for IDs across generated programs, to maintain uniqueness without pushing complexity.
 */
const kNestedIdMultiplier = 1;

describe('ProgramComparison', () => {
    function createSimpleFloor(floor: PartialWithRequiredId<Floor>): Floor {
        return {
            year: 2024,
            name: 'Example floor',
            description: null,
            cssBackgroundColor: null,
            ...floor,
        };
    }

    function createSimpleLocation(location: PartialWithRequiredId<Location>): Location {
        return {
            year: 2024,
            name: 'Example location',
            useName: null,
            sponsor: null,
            floor: createSimpleFloor({ id: 10 }),
            ...location,
        };
    }

    function createSimpleTimeslot(timeslot: PartialWithRequiredId<Timeslot>): Timeslot {
        return {
            dateStartsAt: '2024-06-09 10:00:00',
            dateEndsAt: '2024-06-09 10:30:00',
            location: createSimpleLocation({ id: 100 }),
            ...timeslot,
        };
    }

    function createSimpleActivity(activity: PartialWithRequiredId<Activity>): Activity {
        return {
            year: '2024',
            title: 'Example activity',
            sponsor: null,
            visible: true,
            reasonInvisible: null,
            spellChecked: true,
            maxVisitors: null,
            price: null,
            rules: null,
            description: null,
            printDescription: null,
            webDescription: null,
            socialDescription: null,
            url: null,
            prizes: null,
            techInfo: /* accessible but empty= */ null,
            logisticsInfo: /* accessible but empty= */ null,
            financeInfo: /* accessible but empty= */ null,
            ticketsInfo: /* accessible but empty= */ null,
            largeImage: null,
            smallImage: null,
            activityType: null, // ...
            timeslots: [ createSimpleTimeslot({ id: 1000 + activity.id }) ],
            ...activity,
        };
    }

    it('has the ability to recognise new activities', () => {
        const currentProgram = Program.fromClient([
            createSimpleActivity({ id: 1, title: 'Example activity' }),
        ], [ /* floors */ ]);

        const updatedProgram = Program.fromClient([
            createSimpleActivity({ id: 1, title: 'Example activity' }),
            createSimpleActivity({ id: 2, title: 'A new activity' }),
        ], [ /* floors */ ]);

        const comparison = comparePrograms(currentProgram, updatedProgram);
        expect(comparison.additions).toHaveLength(1);

        expect(comparison.additions[0].type).toEqual('activity');
        expect(comparison.additions[0].id).toEqual(2);

        expect(comparison.removals).toHaveLength(0);
    });

    it('has the ability to recognise new floors in a program', () => {
        // TODO: Implement support for floors
    });

    it('has the ability to recognise new locations in activities', () => {
        const currentProgram = Program.fromClient([
            createSimpleActivity({
                id: 1,
                timeslots: [
                    createSimpleTimeslot({ id: 10 }),
                    createSimpleTimeslot({ id: 11 }),
                ],
            }),
        ], [ /* floors */ ]);

        const updatedProgram = Program.fromClient([
            createSimpleActivity({
                id: 1,
                timeslots: [
                    createSimpleTimeslot({ id: 10 }),
                    createSimpleTimeslot({
                        id: 11,
                        location: createSimpleLocation({ id: 101 }),
                    }),
                ],
            }),
        ], [ /* floors */ ]);

        const comparison = comparePrograms(currentProgram, updatedProgram);
        expect(comparison.additions).toHaveLength(1);

        expect(comparison.additions[0].type).toEqual('location');
        expect(comparison.additions[0].id).toEqual(101);

        expect(comparison.removals).toHaveLength(0);
    });

    it('has the ability to recognise new timeslots in activities', () => {
        const currentProgram = Program.fromClient([
            createSimpleActivity({
                id: 1,
                timeslots: [
                    createSimpleTimeslot({ id: 10 }),
                ],
            }),
        ], [ /* floors */ ]);

        const updatedProgram = Program.fromClient([
            createSimpleActivity({
                id: 1,
                timeslots: [
                    createSimpleTimeslot({ id: 10 }),
                    createSimpleTimeslot({ id: 11 }),
                ],
            }),
        ], [ /* floors */ ]);

        const comparison = comparePrograms(currentProgram, updatedProgram);
        expect(comparison.additions).toHaveLength(1);

        expect(comparison.additions[0].type).toEqual('timeslot');
        expect(comparison.additions[0].id).toEqual(11);

        expect(comparison.removals).toHaveLength(0);
    });

    it('has the ability to recognise removed activities', () => {
        const currentProgram = Program.fromClient([
            createSimpleActivity({ id: 1, title: 'Example activity' }),
            createSimpleActivity({ id: 2, title: 'A not so interesting activity' }),
        ], [ /* floors */ ]);

        const updatedProgram = Program.fromClient([
            createSimpleActivity({ id: 1, title: 'Example activity' }),
        ], [ /* floors */ ]);

        const comparison = comparePrograms(currentProgram, updatedProgram);
        expect(comparison.removals).toHaveLength(1);

        expect(comparison.removals[0].type).toEqual('activity');
        expect(comparison.removals[0].id).toEqual(2);

        expect(comparison.additions).toHaveLength(0);
    });

    it('has the ability to recognise removed floors', () => {
        // TODO: Implement support for floors.
    });

    it('has the ability to recognise removed locations', () => {
        const currentProgram = Program.fromClient([
            createSimpleActivity({
                id: 1,
                timeslots: [
                    createSimpleTimeslot({
                        id: 11,
                        location: createSimpleLocation({ id: 100 }),
                    }),
                    createSimpleTimeslot({
                        id: 11,
                        location: createSimpleLocation({ id: 101 }),
                    }),
                ],
            }),
        ], [ /* floors */ ]);

        const updatedProgram = Program.fromClient([
            createSimpleActivity({
                id: 1,
                timeslots: [
                    createSimpleTimeslot({
                        id: 11,
                        location: createSimpleLocation({ id: 100 }),
                    }),
                    createSimpleTimeslot({
                        id: 11,
                        location: createSimpleLocation({ id: 100 }),  // <-- moved
                    }),
                ],
            }),
        ], [ /* floors */ ]);

        const comparison = comparePrograms(currentProgram, updatedProgram);
        expect(comparison.removals).toHaveLength(1);

        expect(comparison.removals[0].type).toEqual('location');
        expect(comparison.removals[0].id).toEqual(101);

        expect(comparison.additions).toHaveLength(0);
    });

    it('has the ability to recognise removed timeslots', () => {
        const currentProgram = Program.fromClient([
            createSimpleActivity({
                id: 1,
                timeslots: [
                    createSimpleTimeslot({ id: 10 }),
                    createSimpleTimeslot({ id: 11 }),
                ],
            }),
        ], [ /* floors */ ]);

        const updatedProgram = Program.fromClient([
            createSimpleActivity({
                id: 1,
                timeslots: [
                    createSimpleTimeslot({ id: 10 }),
                ],
            }),
        ], [ /* floors */ ]);

        const comparison = comparePrograms(currentProgram, updatedProgram);
        expect(comparison.removals).toHaveLength(1);

        expect(comparison.removals[0].type).toEqual('timeslot');
        expect(comparison.removals[0].id).toEqual(11);

        expect(comparison.additions).toHaveLength(0);
    });

    it('has the ability to recognise updated activities', () => {
        // TODO
    });

    it('has the ability to recognise updated floors', () => {
        // TODO: Implement support for floors.
    });

    it('has the ability to recognise updated locations', () => {
        // TODO
    });

    it('has the ability to recognise updated timeslots', () => {
        // TODO
    });
});
