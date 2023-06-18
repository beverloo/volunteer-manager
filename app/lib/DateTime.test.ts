// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { DateTimeFormat, DateTime } from './DateTime';

describe('DateTime', () => {
    it('should be able to parse times in the ISO 8601 format', () => {
        const cases = [
            [ '2023-06-01', [ 2023, 6, 1, 0, 0, 0, '2023-06-01 00:00:00' ] ],
            [ '2023-06-01 12:13:14', [ 2023, 6, 1, 12, 13, 14, '2023-06-01 12:13:14' ] ],
            [ '1900-01-01 01:02:03', [ 1900, 1, 1, 1, 2, 3, '1900-01-01 01:02:03' ] ],
            [ '2100-12-12 23:59:59', [ 2100, 12, 12, 23, 59, 59, '2100-12-12 23:59:59' ] ],
            [ '2050-10-20T12:15:30Z', [ 2050, 10, 20, 12, 15, 30, '2050-10-20 12:15:30' ] ],
            [ '2050-10-20T12:15:30-02:00', [ 2050, 10, 20, 14, 15, 30, '2050-10-20 14:15:30' ] ],
        ] as const;

        for (const [ input, [ y, m, d, h, i, s, output ] ] of cases) {
            const dateTime = DateTime.From(input);

            expect(dateTime.year).toEqual(y);
            expect(dateTime.month).toEqual(m);
            expect(dateTime.date).toEqual(d);
            expect(dateTime.hour).toEqual(h);
            expect(dateTime.minute).toEqual(i);
            expect(dateTime.second).toEqual(s);

            expect(dateTime.format(DateTimeFormat.ISO8601_DATE_TIME)).toEqual(output);
        }
    });

    it('should be able to parse times in custom formats', () => {
        const cases = [
            [ '2023/06/01 12:30:00', 'YYYY/MM/DD HH:mm:ss', '2023-06-01 12:30:00' ],
            [ '12:30:2023:01:00:06', 'HH:mm:YYYY:DD:ss:MM', '2023-06-01 12:30:00' ],
        ] as const;

        for (const [ input, format, output ] of cases) {
            const dateTime = DateTime.Parse(input, format);
            expect(dateTime.format(DateTimeFormat.ISO8601_DATE_TIME)).toEqual(output);
        }
    });

    it('should be able to obtain instances for the current time', () => {
        const dateTime = DateTime.Now('UTC');
        const date = new Date();

        expect(dateTime.year).toEqual(date.getUTCFullYear());
        expect(dateTime.month).toEqual(date.getUTCMonth() + 1);
        expect(dateTime.date).toEqual(date.getUTCDate());

        expect(dateTime.hour).toEqual(date.getUTCHours());
        expect(dateTime.minute).toEqual(date.getUTCMinutes());
        expect(Math.abs(date.getUTCSeconds() - dateTime.second)).toBeLessThan(5);
    });

    it('should be able to store times in different timezones', () => {
        const amsterdam = DateTime.From('2023-06-18 21:30:00', 'Europe/Amsterdam');
        const london = DateTime.From('2023-06-18 21:30:00', 'Europe/London');

        expect(amsterdam.year).toEqual(london.year);
        expect(amsterdam.month).toEqual(london.month);
        expect(amsterdam.date).toEqual(london.date);

        expect(amsterdam.hour).toEqual(london.hour);
        expect(amsterdam.minute).toEqual(london.minute);
        expect(amsterdam.second).toEqual(london.second);

        expect(amsterdam.unix).not.toEqual(london.unix);
        expect(amsterdam.toString()).not.toEqual(london.toString());
    });
});
