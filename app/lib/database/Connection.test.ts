// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { LogSeverity } from './Types';
import { useMockConnection } from './Connection';
import db, { sql, tLogs, tHotels } from './index';

describe('Connection', () => {
    const mockConnection = useMockConnection();

    it('is able to intercept queries using the `useMockConnection` mechanism', async () => {
        mockConnection.expect('selectOneRow');
        {
            const result = await db.selectFrom(tHotels).select({
                eventId: tHotels.eventId,
                hotelName: tHotels.hotelName,
            }).executeSelectNoneOrOne();

            expect(result).toBeNull();
        }

        mockConnection.expect('selectOneRow',
            (query, params) => ({ eventId: 42, hotelName: 'Fancy Hotel' }));
        {
            const result = await db.selectFrom(tHotels).select({
                eventId: tHotels.eventId,
                hotelName: tHotels.hotelName,
            }).executeSelectNoneOrOne();

            expect(result).not.toBeNull();
            expect(result?.eventId).toBe(42);
            expect(result?.hotelName).toBe('Fancy Hotel');
        }

        mockConnection.expect('insertReturningLastInsertedId', (query, params) => 42);
        {
            const result = await db.insertInto(tHotels).values({
                eventId: 1,
                hotelName: 'Fancy Hotel',
                hotelDescription: 'A super fancy hotel',
                hotelRoomName: 'Fancy Room',
                hotelRoomPeople: 2,
                hotelRoomPrice: 18000,
            }).returningLastInsertedId().executeInsert();

            expect(result).toEqual(42);
        }
    });

    it('should be able to work with custom enums we include in the generation tool', async () => {
        mockConnection.expect('insert', () => /* insertId= */ 9001);
        mockConnection.expect('selectOneRow', () => ({ severity: LogSeverity.Warning }));

        const insertResult = await db.insertInto(tLogs).values({
            logType: 'my-log-type',
            logSeverity: LogSeverity.Info,
        }).executeInsert();

        expect(insertResult).toEqual(9001);

        const selectResult = await db.selectFrom(tLogs).select({
            severity: tLogs.logSeverity,
        }).executeSelectOne();

        expect(selectResult.severity).toEqual(LogSeverity.Warning);


    });
});
