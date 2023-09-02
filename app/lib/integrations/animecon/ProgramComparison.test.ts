// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Activity, Floor, Location, Timeslot } from './AnimeConTypes';
import { Program } from './Program';
import { ProgramUpdateSeverity, comparePrograms } from './ProgramComparison';

type PartialWithRequiredId<T> = Partial<T> & { id: number};

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

        expect(comparison.updates).toHaveLength(0);
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

        expect(comparison.updates).toHaveLength(1);

        expect(comparison.updates[0].type).toEqual('timeslot');
        expect(comparison.updates[0].id).toEqual(11);
        expect(comparison.updates[0].fields).toEqual([ 'locationId' ]);

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

        expect(comparison.updates).toHaveLength(0);
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
        expect(comparison.updates).toHaveLength(0);
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

        expect(comparison.updates).toHaveLength(1);

        expect(comparison.updates[0].type).toEqual('timeslot');
        expect(comparison.updates[0].id).toEqual(11);
        expect(comparison.updates[0].fields).toEqual([ 'locationId' ]);
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
        expect(comparison.updates).toHaveLength(0);
    });

    it('has the ability to recognise updated activities', () => {
        const currentProgram = Program.fromClient([
            createSimpleActivity({ id: 1, title: 'Example title' }),
            createSimpleActivity({ id: 2, visible: false }),
            createSimpleActivity({ id: 3, description: 'Example', url: undefined }),
            createSimpleActivity({ id: 4 }),
        ], [ /* floors */ ]);

        const updatedProgram = Program.fromClient([
            createSimpleActivity({ id: 1, title: 'Updated title' }),
            createSimpleActivity({ id: 2, visible: /* minor change= */ true }),
            createSimpleActivity({ id: 3, description: 'Updated', url: 'https://example.com' }),
            createSimpleActivity({ id: 4 }),
        ], [ /* floors */ ]);

        const comparison = comparePrograms(currentProgram, updatedProgram);
        expect(comparison.updates).toHaveLength(3);

        expect(comparison.updates).toIncludeSameMembers([
            {
                type: 'activity',
                id: 1,
                fields: [ 'name' ],
                severity: ProgramUpdateSeverity.Low,
            },
            {
                type: 'activity',
                id: 2,
                fields: [ 'visible' ],
                severity: ProgramUpdateSeverity.Minor,
            },
            {
                type: 'activity',
                id: 3,
                fields: [ 'description', 'url' ],
                severity: ProgramUpdateSeverity.Low
            },
        ]);

        expect(comparison.additions).toHaveLength(0);
        expect(comparison.removals).toHaveLength(0);
    });

    it('has the ability to recognise updated floors', () => {
        // TODO: Implement support for floors.
    });

    it('has the ability to recognise updated locations', () => {
        const currentProgram = Program.fromClient([
            createSimpleActivity({
                id: 1,
                timeslots: [
                    createSimpleTimeslot({
                        id: 11,
                        location: createSimpleLocation({ id: 101, name: 'Example 1' }),
                    }),
                    createSimpleTimeslot({
                        id: 12,
                        location: createSimpleLocation({ id: 102, name: 'Example 2' }),
                    }),
                ],
            }),
            createSimpleActivity({
                id: 2,
                timeslots: [
                    createSimpleTimeslot({
                        id: 13,
                        location: createSimpleLocation({ id: 102, name: 'Example 2' }),
                    }),
                    createSimpleTimeslot({
                        id: 14,
                        location: createSimpleLocation({
                            id: 103,
                            name: 'Example 3',
                            floor: createSimpleFloor({
                                id: 1001,
                                name: '1st floor',
                            }),
                        }),
                    }),
                ],
            })
        ], [ /* floors */ ]);

        const updatedProgram = Program.fromClient([
            createSimpleActivity({
                id: 1,
                timeslots: [
                    createSimpleTimeslot({
                        id: 11,
                        location: createSimpleLocation({
                            id: 101,
                            name: 'Example 1',
                            floor: createSimpleFloor({
                                id: 1001,
                                name: '1st floor',
                            }),
                        }),
                    }),
                    createSimpleTimeslot({
                        id: 12,
                        location: createSimpleLocation({ id: 102, name: 'Example 2 (new!)' }),
                    }),
                ],
            }),
            createSimpleActivity({
                id: 2,
                timeslots: [
                    createSimpleTimeslot({
                        id: 13,
                        location: createSimpleLocation({ id: 102, name: 'Example 2 (new!)' }),
                    }),
                    createSimpleTimeslot({
                        id: 14,
                        location: createSimpleLocation({
                            id: 103,
                            name: 'Example 3',
                            floor: createSimpleFloor({
                                id: 1001,
                                name: '1st floor',
                            }),
                        }),
                    }),
                ],
            })
        ], [ /* floors */ ]);

        const comparison = comparePrograms(currentProgram, updatedProgram);
        expect(comparison.updates).toHaveLength(1);

        expect(comparison.updates).toIncludeSameMembers([
            // Change detector test: this will start failing when floor support is added.
            /*
            {
                type: 'location',
                id: 101,
                fields: [ 'floorId' ],
                severity: ProgramUpdateSeverity.Low,
            },
            */
            {
                type: 'location',
                id: 102,
                fields: [ 'name' ],
                severity: ProgramUpdateSeverity.Low,
            },
        ]);

        expect(comparison.additions).toHaveLength(0);
        expect(comparison.removals).toHaveLength(0);
    });

    it('has the ability to recognise updated timeslots', () => {
        const currentProgram = Program.fromClient([
            createSimpleActivity({
                id: 1,
                timeslots: [
                    createSimpleTimeslot({
                        id: 10,
                        location: createSimpleLocation({ id: 100 }),
                        dateStartsAt: '2024-08-28 15:30:00',
                        dateEndsAt: '2024-08-28 16:00:00',
                    }),
                    createSimpleTimeslot({
                        id: 11,
                        location: createSimpleLocation({ id: 101 }),
                        dateStartsAt: '2024-08-28 18:00:00',
                        dateEndsAt: '2024-08-28 18:30:00',
                    }),
                ]
            }),
            createSimpleActivity({
                id: 2,
                timeslots: [
                    createSimpleTimeslot({
                        id: 13,
                        location:createSimpleLocation({ id: 102 }),
                        dateStartsAt: '2024-08-28 20:00:00',
                        dateEndsAt: '2024-08-28 20:30:00',
                    }),
                    createSimpleTimeslot({
                        id: 14,
                        location: createSimpleLocation({ id: 102 }),
                        dateStartsAt: '2024-08-28 20:30:00',
                        dateEndsAt: '2024-08-28 21:00:00',
                    }),
                ],
            }),
        ], [ /* floors */ ]);

        const updatedProgram = Program.fromClient([
            createSimpleActivity({
                id: 1,
                timeslots: [
                    createSimpleTimeslot({
                        id: 10,
                        location: createSimpleLocation({ id: 100 }),
                        dateStartsAt: '2024-08-28 15:00:00',  // <-- updated
                        dateEndsAt: '2024-08-28 15:30:00',  // <-- updated
                    }),
                    createSimpleTimeslot({
                        id: 11,
                        location: createSimpleLocation({ id: 101 }),
                        dateStartsAt: '2024-08-28 18:00:00',
                        dateEndsAt: '2024-08-28 18:30:00',
                    }),
                ]
            }),
            createSimpleActivity({
                id: 2,
                timeslots: [
                    createSimpleTimeslot({
                        id: 13,
                        location: createSimpleLocation({ id: 101 }),  // <-- updated
                        dateStartsAt: '2024-08-28 20:00:00',
                        dateEndsAt: '2024-08-28 20:30:00',
                    }),
                    createSimpleTimeslot({
                        id: 14,
                        location: createSimpleLocation({ id: 102 }),
                        dateStartsAt: '2024-08-28 20:30:00',
                        dateEndsAt: '2024-08-28 21:00:00',
                    }),
                ],
            }),
        ], [ /* floors */ ]);

        const comparison = comparePrograms(currentProgram, updatedProgram);
        expect(comparison.updates).toHaveLength(2);

        expect(comparison.updates).toIncludeSameMembers([
            {
                type: 'timeslot',
                id: 10,
                fields: [ 'startDate', 'endDate' ],
                severity: ProgramUpdateSeverity.Major,
            },
            {
                type: 'timeslot',
                id: 13,
                fields: [ 'locationId' ],
                severity: ProgramUpdateSeverity.Minor,
            },
        ]);

        expect(comparison.additions).toHaveLength(0);
        expect(comparison.removals).toHaveLength(0);
    });
});
