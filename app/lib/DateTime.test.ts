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

    it('should be able to compare two DateTime instances', () => {
        // Comparison between two timezones:
        {
            const amsterdam = DateTime.From('2023-06-18 21:30:00', 'Europe/Amsterdam');
            const london = DateTime.From('2023-06-18 21:30:00', 'Europe/London');

            expect(amsterdam.isBefore(london)).toBeTruthy();
            expect(amsterdam.isAfter(london)).toBeFalsy();

            expect(london.isBefore(amsterdam)).toBeFalsy();
            expect(london.isAfter(amsterdam)).toBeTruthy();
        }

        // Comparison between two regular dates:
        {
            const left = DateTime.From('2023-06-10 00:00:00');
            const right = DateTime.From('2023-06-20 23:59:59');

            expect(left.isBefore(right)).toBeTruthy();
            expect(left.isAfter(right)).toBeFalsy();

            expect(right.isBefore(left)).toBeFalsy();
            expect(right.isAfter(left)).toBeTruthy();
        }

        // With limited granularities (several cases):
        {
            const cases = [
                [ '2023-06-00 00:00:00', '2024-12-00 00:00:00', 'year', 'before' ],
                [ '2023-06-00 00:00:00', '2022-12-00 00:00:00', 'year', 'after' ],
                [ '2023-06-00 00:00:00', '2023-12-00 00:00:00', 'year', 'same' ],

                [ '2023-06-10 00:00:00', '2023-07-10 00:00:00', 'month', 'before' ],
                [ '2023-06-10 00:00:00', '2023-05-10 00:00:00', 'month', 'after' ],
                [ '2023-06-10 00:00:00', '2023-06-20 00:00:00', 'month', 'same' ],

                [ '2023-06-10 21:00:00', '2023-06-20 21:00:00', 'date', 'before' ],
                [ '2023-06-10 21:00:00', '2023-06-05 21:00:00', 'date', 'after' ],
                [ '2023-06-10 21:00:00', '2023-06-10 23:00:00', 'date', 'same' ],

                [ '2023-06-10 21:30:00', '2023-06-10 22:30:00', 'hour', 'before' ],
                [ '2023-06-10 21:30:00', '2023-06-10 20:30:00', 'hour', 'after' ],
                [ '2023-06-10 21:30:00', '2023-06-10 21:45:00', 'hour', 'same' ],

                [ '2023-06-10 21:30:45', '2023-06-10 21:45:45', 'minute', 'before' ],
                [ '2023-06-10 21:30:45', '2023-06-10 21:15:45', 'minute', 'after' ],
                [ '2023-06-10 21:30:45', '2023-06-10 21:30:50', 'minute', 'same' ],
            ] as const;

            for (const [ leftInput, rightInput, unit, expected ] of cases) {
                const left = DateTime.From(leftInput);
                const right = DateTime.From(rightInput);

                switch (expected) {
                    case 'after':
                        expect(left.isBefore(right, unit)).toBeFalsy();
                        expect(left.isAfter(right, unit)).toBeTruthy();

                        expect(right.isBefore(left, unit)).toBeTruthy();
                        expect(right.isAfter(left, unit)).toBeFalsy();

                        expect(left.isSame(right, unit)).toBeFalsy();
                        expect(right.isSame(left, unit)).toBeFalsy();
                        break;

                    case 'before':
                        expect(left.isBefore(right, unit)).toBeTruthy();
                        expect(left.isAfter(right, unit)).toBeFalsy();

                        expect(right.isBefore(left, unit)).toBeFalsy();
                        expect(right.isAfter(left, unit)).toBeTruthy();

                        expect(left.isSame(right, unit)).toBeFalsy();
                        expect(right.isSame(left, unit)).toBeFalsy();
                        break;

                    case 'same':
                        expect(left.isBefore(right, unit)).toBeFalsy();
                        expect(left.isAfter(right, unit)).toBeFalsy();

                        expect(right.isBefore(left, unit)).toBeFalsy();
                        expect(right.isAfter(left, unit)).toBeFalsy();

                        expect(left.isSame(right, unit)).toBeTruthy();
                        expect(right.isSame(left, unit)).toBeTruthy();
                        break;
                }
            }
        }
    });
});
