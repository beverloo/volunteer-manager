// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { TextDecoder, TextEncoder } from 'util';
import { z } from 'zod';

import { Program, deserializeProgram, serializeProgram } from './Program';
import { kActivityDefinition, kFloorDefinition } from './AnimeConTypes';

import exampleEventActivities from './test/animecon-2023.json';

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

describe('Program', () => {
    it('should be able to import one of the real event programs', async () => {
        const activities = z.array(kActivityDefinition).parse(exampleEventActivities);
        const floors = z.array(kFloorDefinition).parse([ /* TODO */ ]);

        const program = Program.fromClient(activities, floors);
        expect([ ...program.activities ]).toHaveLength(activities.length);
        expect([ ...program.floors ]).toHaveLength(floors.length);
    });

    it('should be able to serialize and deserialize events', async () => {
        const activities = z.array(kActivityDefinition).parse(exampleEventActivities);
        const floors = z.array(kFloorDefinition).parse([ /* TODO */ ]);

        const program = Program.fromClient(activities, floors);

        for (const useCompression of [ true, false ]) {
            const serializedProgram = await serializeProgram(program, useCompression);
            const deserializedProgram = await deserializeProgram(serializedProgram, useCompression);

            expect([ ...program.activities ]).toEqual([ ...deserializedProgram.activities ]);
            expect([ ...program.floors ]).toEqual([ ...deserializedProgram.floors ]);
            expect([ ...program.locations ]).toEqual([ ...deserializedProgram.locations ]);
            expect([ ...program.timeslots ]).toEqual([ ...deserializedProgram.timeslots ]);

            const firstTimeslot = [ ...program.timeslots ][0];

            expect(program.getTimeslot(firstTimeslot.id)).not.toBeUndefined();
            expect(deserializedProgram.getTimeslot(firstTimeslot.id)).not.toBeUndefined();

            const left = program.getTimeslot(firstTimeslot.id)!.startDate;
            const right = deserializedProgram.getTimeslot(firstTimeslot.id)!.startDate;

            expect(left.isSame(right)).toBeTruthy();
        }
    });
});
