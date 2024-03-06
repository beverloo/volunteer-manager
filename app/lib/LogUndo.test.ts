// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { createLogUndo, executeLogUndo } from './LogUndo';
import { useMockConnection } from './database/Connection';

import { tActivities } from './database';

describe('LogUndo', () => {
    const mockConnection = useMockConnection();

    it('is able to create serialized log undo representations', () => {
        const serializedLogUndo = createLogUndo({
            table: tActivities,
            resetColumn: tActivities.activityDeleted,
            idColumn: tActivities.activityId,
            id: /* activityId= */ 42,
        });

        const unserializedLogUndo = JSON.parse(serializedLogUndo);
        expect(unserializedLogUndo).toEqual({
            table: 'activities',
            resetColumn: 'activity_deleted',
            idColumn: 'activity_id',
            id: 42,
        });
    });

    it('will choke on incorrectly serialized log undo representations', async () => {
        expect(await executeLogUndo(/* logId= */ 100, '')).toBeFalse();
        expect(await executeLogUndo(/* logId= */ 100, null!)).toBeFalse();
        expect(await executeLogUndo(/* logId= */ 100, 42 as any as string)).toBeFalse();
        expect(await executeLogUndo(/* logId= */ 100, '{"table":"foo"}')).toBeFalse();
    });

    it('is able to execute on serialized log undo representations', async () => {
        const serializedLogUndo = createLogUndo({
            table: tActivities,
            resetColumn: tActivities.activityDeleted,
            idColumn: tActivities.activityId,
            id: /* activityId= */ 42,
        });

        const result = await executeLogUndo(/* logId= */ 100, serializedLogUndo);
        expect(result).toBeTrue();
    });
});
