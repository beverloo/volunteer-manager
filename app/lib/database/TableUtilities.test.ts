// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { tUsersEvents, tUsers } from './';
import { getColumnFromName, getNameFromColumn, getNameFromTable, getTableFromName }
    from './TableUtilities';

describe('TableUtilities', () => {
    it('is able to convert between columns and their names', () => {
        expect(getNameFromColumn(tUsers, tUsers.gender)).toBe('gender');
        expect(getNameFromColumn(tUsersEvents, tUsersEvents.availabilityEventLimit))
            .toBe('availability_event_limit');
        expect(() => getNameFromColumn(tUsers, tUsersEvents.eventId)).toThrow();

        expect(getColumnFromName(tUsers, 'gender')).toStrictEqual(tUsers.gender);
        expect(getColumnFromName(tUsersEvents, 'availability_event_limit')).toStrictEqual(
            tUsersEvents.availabilityEventLimit);
        expect(getColumnFromName(tUsersEvents, 'foo')).toBeUndefined();
    });

    it('is able to convert between tables and their names', () => {
        expect(getNameFromTable(tUsers)).toBe('users');
        expect(getNameFromTable(tUsersEvents)).toBe('users_events');
        expect(() => getNameFromTable({} as any)).toThrow();

        expect(getTableFromName('users')).toStrictEqual(tUsers);
        expect(getTableFromName('users_events')).toStrictEqual(tUsersEvents);
        expect(getTableFromName('foo')).toBeUndefined();
    });
});

