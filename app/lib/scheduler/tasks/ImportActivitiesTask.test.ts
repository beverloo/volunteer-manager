// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Activity, Floor, Location, Timeslot } from '@lib/integrations/animecon';
import { ImportActivitiesTask, type StoredActivity, type StoredTimeslot } from './ImportActivitiesTask';
import { MutationSeverity } from '@lib/database/Types';
import { TaskContext } from '../TaskContext';
import { dayjs } from '@lib/DateTime';
import { useMockConnection } from '@lib/database/Connection';

type PartialWithRequiredId<T> = Partial<T> & { id: number};

describe('ImportActivitiesTask', () => {
    const mockConnection = useMockConnection();

    type PartialStoredActivity = PartialWithRequiredId<Omit<StoredActivity, 'id' | 'timeslots'>>;
    type PartialStoredTimeslot = PartialWithRequiredId<Omit<StoredTimeslot, 'id'>>;

    function createStoredActivity(
        activity: PartialStoredActivity, timeslots: PartialStoredTimeslot[]): StoredActivity
    {
        return {
            created: new Date('2023-12-23T12:00:00+01:00'),
            updated: new Date('2023-12-23T12:00:00+01:00'),
            deleted: undefined,

            title: 'Example activity',
            description: undefined,
            url: undefined,
            price: undefined,
            helpNeeded: 0,
            maxVisitors: undefined,
            visible: 1,
            visibleReason: undefined,

            type: {
                adultsOnly: 0,
                competition: 0,
                cosplay: 0,
                event: 0,
                gameRoom: 0,
                video: 0,
            },

            timeslots: timeslots.map(timeslot => ({
                startTime: new Date('2024-06-09T09:00:00+00:00'),
                endTime: new Date('2024-06-09T09:30:00+00:00'),
                locationId: 100,
                locationName: 'Example location',

                ...timeslot,
            })),

            ...activity,
        };
    }

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
            area: 'Example floor',
            floor: createSimpleFloor({ id: 10 }),
            floorId: 1000,
            ...location,
        };
    }

    function createSimpleTimeslot(timeslot: PartialWithRequiredId<Timeslot>): Timeslot {
        return {
            dateStartsAt: '2024-06-09T10:00:00+01:00',
            dateEndsAt: '2024-06-09T10:30:00+01:00',
            location: createSimpleLocation({ id: 100 }),
            ...timeslot,
        };
    }

    function createSimpleActivity(activity: PartialWithRequiredId<Activity>): Activity {
        return {
            year: '2024',
            festivalId: 101,
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
            helpNeeded: false,
            largeImage: null,
            smallImage: null,
            activityType: null, // ...
            timeslots: [ createSimpleTimeslot({ id: 1000 + activity.id }) ],
            ...activity,
        };
    }

    interface FestivalOptions {
        festivalEndTime: Date;
        festivalId: number;
        activities?: Activity[];
        storedActivities?: StoredActivity[];
    }

    function createImportActivitiesTaskForFestival(options?: FestivalOptions, skipDb?: boolean) {
        const context = TaskContext.forEphemeralTask('ImportActivitiesTask', { /* no params */ });
        const task = new class extends ImportActivitiesTask {
            constructor() {
                super(context);
            }

            override async fetchActivitiesFromApi(festivalId: number): Promise<Activity[]> {
                return options?.activities ?? [];
            }

            override async fetchActivitiesFromDatabase(festivalId: number)
                : Promise<StoredActivity[]>
            {
                return options?.storedActivities ?? [];
            }
        };

        expect(task.isComplexTask()).toBeTrue();
        expect(() => task.validate({ /* no params */ })).not.toThrow();

        if (!skipDb) {
            mockConnection.expect('selectOneRow', () => {
                if (!options)
                    return undefined;

                return {
                    festivalEndTime: options.festivalEndTime,
                    festivalId: options.festivalId,
                };
            });
        }

        return task;
    }

    it('should skip when there are no upcoming festivals', async () => {
        const task = createImportActivitiesTaskForFestival(/* no festival= */ undefined);
        expect(task.contextForTesting.intervalMsForTesting).toBeUndefined();

        const result = await task.execute({ /* no params */ });
        expect(result).toBeTrue();

        expect(task.log.entries).toHaveLength(1);
        expect(task.log.entries[0].message).toInclude('No future events');

        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportActivitiesTask.kIntervalMaximum);
    });

    it('should skip when no activities were returned from the AnimeCon API', async () => {
        const task = createImportActivitiesTaskForFestival({
            festivalEndTime: dayjs().add(100, 'days').toDate(),
            festivalId: 101,
        });

        const result = await task.execute({ /* no params */ });
        expect(result).toBeTrue();

        expect(task.log.entries).toHaveLength(2);
        expect(task.log.entries[0].message).toInclude('Interval');
        expect(task.log.entries[1].message).toInclude('No activities were returned');
    });

    it('should scale the task interval based on duration until the festival', async () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        expect(task.contextForTesting.intervalMsForTesting).toBeUndefined();

        // Confirm that the configured intervals will be applied as expected.
        for (const { maximumDays, intervalMs } of ImportActivitiesTask.kIntervalConfiguration) {
            task.updateTaskIntervalForFestivalDate(dayjs().add(maximumDays, 'days').toDate());
            expect(task.contextForTesting.intervalMsForTesting).toBe(intervalMs);
        }

        // Confirm that events that won't happen for at least 9 months won't update frequently.
        task.updateTaskIntervalForFestivalDate(dayjs().add(1, 'year').toDate());
        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportActivitiesTask.kIntervalMaximum);

        // Confirm that events that have already happened won't update frequently.
        task.updateTaskIntervalForFestivalDate(dayjs().subtract(1, 'day').toDate());
        expect(task.contextForTesting.intervalMsForTesting).toBe(
            ImportActivitiesTask.kIntervalMaximum);
    });

    it('should be able to deal with a hardcoded festival Id for a one-off import', async () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        expect(task.contextForTesting.intervalMsForTesting).toBeUndefined();

        // Confirm that, by default, no festival Id will be passed in the select query.
        mockConnection.expect('selectOneRow', (query, params) => {
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(/* false= */ 0);
            expect(params[1]).toBe(/* limit= */ 1);

            return {
                festivalEndTime: dayjs().add(100, 'days').toDate(),
                festivalId: 101,
            };
        });

        const implicitFestivalResult = await task.execute({ /* no params */ });
        expect(implicitFestivalResult).toBeTrue();

        // Confirm that a task interval is set based on duration until the festival.
        expect(task.contextForTesting.intervalMsForTesting).not.toBeUndefined();

        // Confirm that, when an explicit festival Id is given, it's passed to the select query.
        mockConnection.expect('selectOneRow', (query, params) => {
            expect(params).toHaveLength(2);
            expect(params[0]).toBe(/* festivalId= */ 9001);
            expect(params[1]).toBe(/* limit= */ 1);

            return {
                festivalEndTime: dayjs().add(100, 'days').toDate(),
                festivalId: 9001,
            };
        });

        const explicitFestivalResult = await task.execute({ festivalId: 9001 });
        expect(explicitFestivalResult).toBeTrue();

        // Confirm that the task remains as a one-off task.
        expect(task.contextForTesting.intervalMsForTesting).toBeUndefined();
    });

    it('should have the ability to escalate the severity level of a mutation', () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        const regularActivity = createSimpleActivity({ id: 100 });
        const regularStoredActivity = createStoredActivity({ id: 100 }, [ /* no timeslots */ ]);

        const helpNeededActivity = createSimpleActivity({ id: 101, helpNeeded: true });
        const helpNeededStoredActivity = createStoredActivity(
            { id: 101, helpNeeded: 1 }, [ /* no timeslots */ ]);

        expect(task.maybeEscalateMutationSeverity(regularActivity, MutationSeverity.Moderate))
            .toBe(MutationSeverity.Moderate);
        expect(task.maybeEscalateMutationSeverity(regularStoredActivity, MutationSeverity.Moderate))
            .toBe(MutationSeverity.Moderate);

        expect(task.maybeEscalateMutationSeverity(
            helpNeededActivity, MutationSeverity.Moderate)).toBe(MutationSeverity.Important);
        expect(task.maybeEscalateMutationSeverity(
            helpNeededStoredActivity, MutationSeverity.Moderate)).toBe(MutationSeverity.Important);
    });

    it('should be able to identify additions to the program', () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        const mutations = task.compareActivities([
            createSimpleActivity({
                id: 100,
                timeslots: [ createSimpleTimeslot({ id: 1100 }) ]
            }),
            createSimpleActivity({
                id: 101,
                timeslots: [ createSimpleTimeslot({ id: 1101 }) ]
            })
        ], [
            createStoredActivity({ id: 100 }, /* timeslots= */ [ { id: 1100 } ]),
            // Note: ID `101` (w/ timeslot `1101`) are missing
        ]);

        expect(mutations.created).toHaveLength(2);  // activity + timeslot
        expect(mutations.updated).toHaveLength(0);
        expect(mutations.deleted).toHaveLength(0);

        expect(mutations.mutations).toHaveLength(2);
        expect(mutations.mutations[0]).toEqual({
            activityId: 101,
            mutation: 'Created',
            severity: 'Moderate',
        });

        expect(mutations.mutations[1]).toEqual({
            activityId: 101,
            activityTimeslotId: 1101,
            mutation: 'Created',
            severity: 'Moderate',
        });
    });

    it('should be able to identify additions to locations in the program', () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        const mutations = task.compareActivities([
            createSimpleActivity({
                id: 100,
                timeslots: [
                    createSimpleTimeslot({
                        id: 1100,
                        location: createSimpleLocation({ id: 11100 }),
                    }),
                    createSimpleTimeslot({
                        id: 1101,
                        location: createSimpleLocation({ id: 11101 }),  // <-- new location Id
                    }),
                ]
            }),
        ], [
            createStoredActivity({ id: 100 }, /* timeslots= */ [
                { id: 1100, locationId: 11100 },
                { id: 1101, locationId: 11100 }  // <-- old location Id
            ]),
        ]);

        expect(mutations.created).toHaveLength(1);
        expect(mutations.updated).toHaveLength(1);
        expect(mutations.deleted).toHaveLength(0);

        expect(mutations.mutations).toHaveLength(2);
        expect(mutations.mutations[0]).toEqual({
            locationId: 11101,
            mutation: 'Created',
            severity: 'Moderate',
        });

        expect(mutations.mutations[1]).toEqual({
            activityId: 100,
            activityTimeslotId: 1101,
            mutation: 'Updated',
            mutatedFields: [ 'location' ],
            severity: 'Low',
        });
    });

    it('should be able to identify additions to timeslots in the program', () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        const mutations = task.compareActivities([
            createSimpleActivity({
                id: 100,
                timeslots: [
                    createSimpleTimeslot({ id: 1100 }),
                    createSimpleTimeslot({ id: 1101 }),
                ]
            }),
        ], [
            createStoredActivity({ id: 100 }, /* timeslots= */ [ { id: 1100 } ]),
        ]);

        expect(mutations.created).toHaveLength(1);
        expect(mutations.updated).toHaveLength(0);
        expect(mutations.deleted).toHaveLength(0);

        expect(mutations.mutations).toHaveLength(1);
        expect(mutations.mutations[0]).toEqual({
            activityId: 100,
            activityTimeslotId: 1101,
            mutation: 'Created',
            severity: 'Moderate',
        });
    });

    it('should be able to identify updates to activities in the program', () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        const mutations = task.compareActivities([
            createSimpleActivity({
                id: 100,
                title: 'New title',
                description: 'New description',
                url: null,
                price: null,
                helpNeeded: true,
                maxVisitors: 25,
                activityType: {
                    adultsOnly: false,
                    competition: false,
                    cosplay: true,
                    event: true,
                    gameRoom: false,
                    video: false,
                } as any,
                visible: false,
                reasonInvisible: 'Cancelled',
            }),
        ], [
            createStoredActivity({
                id: 100,
                title: 'Old title',
                description: undefined,
                url: undefined,
                price: 100.25,
                helpNeeded: 0,
                maxVisitors: 20,
                type: {
                    adultsOnly: 1,
                    competition: 0,
                    cosplay: 1,
                    event: 0,
                    gameRoom: 0,
                    video: 0,
                },
                visible: 1,
                visibleReason: undefined,
            }, /* timeslots= */ [ { id: 1100 } ]),
        ]);

        expect(mutations.created).toHaveLength(0);
        expect(mutations.updated).toHaveLength(1);
        expect(mutations.deleted).toHaveLength(0);

        expect(mutations.mutations).toHaveLength(1);
        expect(mutations.mutations[0]).toEqual({
            activityId: 100,
            mutation: 'Updated',
            mutatedFields: [
                'title',
                'description',
                'price',
                'help needed flag',
                'max visitors',
                '18+ flag',
                'event flag',
                'visibility',
                'visibility reason',
            ],
            severity: 'Important',
        });
    });

    it('should be able to identify updates to locations in the program', () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        const mutations = task.compareActivities([
            createSimpleActivity({
                id: 100,
                timeslots: [
                    createSimpleTimeslot({
                        id: 1100,
                        location: createSimpleLocation({
                            id: 11100,
                            name: 'Internal Name',
                            useName: 'Public Name',
                        }),
                    })
                ]
            }),
        ], [
            createStoredActivity({ id: 100 }, /* timeslots= */ [
                {
                    id: 1100,
                    locationId: 11100,
                    locationName: 'Old Name',
                }
            ]),
        ]);

        expect(mutations.created).toHaveLength(0);
        expect(mutations.updated).toHaveLength(1);
        expect(mutations.deleted).toHaveLength(0);

        expect(mutations.mutations).toHaveLength(1);
        expect(mutations.mutations[0]).toEqual({
            locationId: 11100,
            mutation: 'Updated',
            mutatedFields: [ 'name' ],
            severity: 'Low',
        });
    });

    it('should be able to identify updates to timeslots in the program', () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        const mutations = task.compareActivities([
            createSimpleActivity({
                id: 100,
                timeslots: [
                    createSimpleTimeslot({
                        id: 1100,
                        dateStartsAt: '2024-06-09T12:00:00+00:00',
                        dateEndsAt: '2024-06-09T12:30:00+00:00',
                        location: createSimpleLocation({ id: 11100 }),
                    }),
                    createSimpleTimeslot({
                        id: 1101,
                        location: createSimpleLocation({ id: 11100 }),  // <-- updated location
                    }),
                    createSimpleTimeslot({
                        id: 1102,
                        location: createSimpleLocation({ id: 11101 }),
                    })
                ]
            }),
        ], [
            createStoredActivity({ id: 100 }, /* timeslots= */ [
                {
                    id: 1100,
                    startTime: new Date('2024-06-09T13:30:00+01:00'),  // <-- moved by 30 minutes
                    endTime: new Date('2024-06-09T13:00:00+01:00'),
                    locationId: 11100
                },
                { id: 1101, locationId: 11101 },  // <-- old location
                { id: 1102, locationId: 11101 },
            ]),
        ]);

        expect(mutations.created).toHaveLength(0);
        expect(mutations.updated).toHaveLength(2);
        expect(mutations.deleted).toHaveLength(0);

        expect(mutations.mutations).toHaveLength(2);
        expect(mutations.mutations[0]).toEqual({
            activityId: 100,
            activityTimeslotId: 1100,
            mutation: 'Updated',
            mutatedFields: [ 'start time', 'end time' ],
            severity: 'Moderate',
        });

        expect(mutations.mutations[1]).toEqual({
            activityId: 100,
            activityTimeslotId: 1101,
            mutation: 'Updated',
            mutatedFields: [ 'location' ],
            severity: 'Low',
        });
    });

    it('should be able to identify removals from the program', () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        const mutations = task.compareActivities([
            createSimpleActivity({
                id: 100,
                timeslots: [ createSimpleTimeslot({ id: 1100 }) ]
            }),
            // Note: ID `101` is missing
        ], [
            createStoredActivity({ id: 100 }, /* timeslots= */ [ { id: 1100 } ]),
            createStoredActivity({ id: 101 }, /* timeslots= */ [ { id: 1101 } ]),
        ]);

        expect(mutations.created).toHaveLength(0);
        expect(mutations.updated).toHaveLength(0);
        expect(mutations.deleted).toHaveLength(2);  // activity + timeslot

        expect(mutations.mutations).toHaveLength(2);
        expect(mutations.mutations[0]).toEqual({
            activityId: 101,
            mutation: 'Deleted',
            severity: 'Moderate',
        });

        expect(mutations.mutations[1]).toEqual({
            activityId: 101,
            activityTimeslotId: 1101,
            mutation: 'Deleted',
            severity: 'Moderate',
        });
    });

    it('should be able to identify removed locations from the program', () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        const mutations = task.compareActivities([
            createSimpleActivity({
                id: 100,
                timeslots: [
                    createSimpleTimeslot({
                        id: 1100,
                        location: createSimpleLocation({ id: 11100 }),
                    }),
                    createSimpleTimeslot({
                        id: 1101,
                        location: createSimpleLocation({ id: 11100 }),  // <-- the same location Id
                    }),
                ]
            }),
        ], [
            createStoredActivity({ id: 100 }, /* timeslots= */ [
                { id: 1100, locationId: 11100 },
                { id: 1101, locationId: 11101 }  // <-- separate location Id
            ]),
        ]);

        expect(mutations.created).toHaveLength(0);
        expect(mutations.updated).toHaveLength(1);
        expect(mutations.deleted).toHaveLength(1);

        expect(mutations.mutations).toHaveLength(2);
        expect(mutations.mutations[0]).toEqual({
            locationId: 11101,
            mutation: 'Deleted',
            severity: 'Moderate',
        });

        expect(mutations.mutations[1]).toEqual({
            activityId: 100,
            activityTimeslotId: 1101,
            mutation: 'Updated',
            mutatedFields: [ 'location' ],
            severity: 'Low',
        });
    });

    it('should be able to identify removed timeslots from the program', () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        const mutations = task.compareActivities([
            createSimpleActivity({
                id: 100,
                timeslots: [
                    createSimpleTimeslot({ id: 1100 }),
                    // Note: ID `1101` is missing
                ]
            }),
        ], [
            createStoredActivity({ id: 100 }, /* timeslots= */ [ { id: 1100 }, { id: 1101 } ]),
        ]);

        expect(mutations.created).toHaveLength(0);
        expect(mutations.updated).toHaveLength(0);
        expect(mutations.deleted).toHaveLength(1);

        expect(mutations.mutations).toHaveLength(1);
        expect(mutations.mutations[0]).toEqual({
            activityId: 100,
            activityTimeslotId: 1101,
            mutation: 'Deleted',
            severity: 'Moderate',
        });
    });

    it('should be able to comprehensively compare fields', () => {
        const task = createImportActivitiesTaskForFestival(
            /* no festival= */ undefined, /* skipDb= */ true);

        // Individual comparisons:
        expect(task.compareField('boolean', /* stored= */ 0, /* current= */ true)).toBeFalse();
        expect(task.compareField('boolean', /* stored= */ 1, /* current= */ true)).toBeTrue();
        expect(task.compareField('boolean', /* stored= */ 0, /* current= */ false)).toBeTrue();
        expect(task.compareField('boolean', /* stored= */ 1, /* current= */ false)).toBeFalse();
        expect(task.compareField('number', /* stored= */ 42, /* current= */ 42)).toBeTrue();
        expect(task.compareField('number', /* stored= */ 42, /* current= */ 9001)).toBeFalse();
        expect(task.compareField('string', /* stored= */ 'Foo', /* current= */ 'Foo')).toBeTrue();
        expect(task.compareField('string', /* stored= */ 'Foo', /* current= */ 'Foo')).toBeTrue();
        expect(task.compareField('number', /* stored= */ NaN, /* current= */ NaN)).toBeTrue();

        // Comprehensive comparisons:
        {
            const lowSeverityUpdates = task.compareFields([
                {
                    name: 'first',
                    weight: /* Low= */ 1,
                    stored: 'Original Value',
                    current: 'Updated Value',
                    comparison: 'string',
                },
                {
                    name: 'second',
                    weight: /* Moderate= */ 10,
                    stored: 1,
                    current: true,
                    comparison: 'boolean',
                }
            ]);

            expect(lowSeverityUpdates.fields).toContainAllValues([ 'first' ]);
            expect(lowSeverityUpdates.severity).toBe('Low');
        }

        {
            const moderateSeverityUpdates = task.compareFields([
                {
                    name: 'first',
                    weight: /* Low= */ 1,
                    stored: 42,
                    current: 101,
                    comparison: 'number',
                },
                {
                    name: 'second',
                    weight: /* Moderate= */ 10,
                    stored: 0,
                    current: true,
                    comparison: 'boolean',
                },
                {
                    name: 'third',
                    weight: /* Important= */ 100,
                    stored: 'Value',
                    current: 'Value',
                    comparison: 'string',
                }
            ]);

            expect(moderateSeverityUpdates.fields).toContainAllValues([ 'first', 'second' ]);
            expect(moderateSeverityUpdates.severity).toBe('Moderate');
        }

        {
            const importantSeverifyUpdates = task.compareFields([
                {
                    name: 'first',
                    weight: /* Low= */ 1,
                    stored: 'Value',
                    current: 'Value',
                    comparison: 'string',
                },
                {
                    name: 'second',
                    weight: /* Moderate= */ 10,
                    stored: 0,
                    current: false,
                    comparison: 'boolean',
                },
                {
                    name: 'third',
                    weight: /* Important= */ 100,
                    stored: 1,
                    current: false,
                    comparison: 'boolean',
                }
            ]);

            expect(importantSeverifyUpdates.fields).toContainAllValues([ 'third' ]);
            expect(importantSeverifyUpdates.severity).toBe('Important');
        }

        {
            const noUpdates = task.compareFields([
                {
                    name: 'first',
                    weight: /* Low= */ 1,
                    stored: 1,
                    current: true,
                    comparison: 'boolean',
                },
                {
                    name: 'second',
                    weight: /* Moderate= */ 10,
                    stored: 42,
                    current: 42,
                    comparison: 'number',
                },
                {
                    name: 'third',
                    weight: /* Important= */ 100,
                    stored: 'Value',
                    current: 'Value',
                    comparison: 'string',
                }
            ]);

            expect(noUpdates.fields).toHaveLength(0);
            expect(noUpdates.severity).toBe('Low');
        }
    });
});
