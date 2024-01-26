// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Temporal, format } from './Temporal';

describe('Temporal', () => {
    it('is able to parse formats correctly', () => {
        const instant = Temporal.Instant.from('2024-01-09T19:00:06.007Z');

        expect(format(instant, 'YYYY-MM-DD')).toEqual('2024-01-09');
        expect(format(instant, 'HH:mm:ss')).toEqual('19:00:06');
        expect(format(instant, '[YYYY-MM-DD]')).toEqual('YYYY-MM-DD');
        expect(format(instant, 'YYYY-[MM]-DD')).toEqual('2024-MM-09');
    });

    it('is able to format Instant', () => {
        const instant = Temporal.Instant.from('2024-01-09T19:00:06.007Z');

        expect(format(instant, 'YY')).toEqual('24');
        expect(format(instant, 'YYYY')).toEqual('2024');

        expect(format(instant, 'M')).toEqual('1');
        expect(format(instant, 'MM')).toEqual('01');
        expect(format(instant, 'MMM')).toEqual('Jan');
        expect(format(instant, 'MMM', 'nl')).toEqual('jan');
        expect(format(instant, 'MMMM')).toEqual('January');
        expect(format(instant, 'MMMM', 'nl')).toEqual('januari');

        expect(format(instant, 'D')).toEqual('9');
        expect(format(instant, 'DD')).toEqual('09');
        expect(format(instant, 'Do')).toEqual('9th');
        expect(format(instant, 'd')).toEqual('2');
        expect(format(instant, 'dd')).toEqual('T');
        expect(format(instant, 'dd', 'nl')).toEqual('D');
        expect(format(instant, 'ddd')).toEqual('Tue');
        expect(format(instant, 'ddd', 'nl')).toEqual('di');
        expect(format(instant, 'dddd')).toEqual('Tuesday');
        expect(format(instant, 'dddd', 'nl')).toEqual('dinsdag');

        expect(format(instant, 'W')).toEqual('2');
        expect(format(instant, 'w')).toEqual('2');
        expect(format(instant, 'Wo')).toEqual('2nd');
        expect(format(instant, 'WW')).toEqual('02');
        expect(format(instant, 'ww')).toEqual('02');

        expect(format(instant, 'H')).toEqual('19');
        expect(format(instant, 'HH')).toEqual('19');
        expect(format(instant, 'h')).toEqual('7');
        expect(format(instant, 'hh')).toEqual('07');
        expect(format(instant, 'k')).toEqual('20');
        expect(format(instant, 'kk')).toEqual('20');

        expect(format(instant, 'm')).toEqual('0');
        expect(format(instant, 'mm')).toEqual('00');

        expect(format(instant, 's')).toEqual('6');
        expect(format(instant, 'ss')).toEqual('06');

        expect(format(instant, 'X')).toEqual('1704826806');
        expect(format(instant, 'x')).toEqual('1704826806007');

        expect(format(instant, 'SSS')).toEqual('007');
        expect(format(instant, 'SSSS')).toEqual('000');

        expect(format(instant, 'Z')).toEqual('+00:00');
        expect(format(instant, 'z')).toEqual('UTC');
        expect(format(instant, 'ZZ')).toEqual('+0000');
        expect(format(instant, 'zzz')).toEqual('UTC');

        expect(format(instant, 'A')).toEqual('PM');
        expect(format(instant, 'a')).toEqual('pm');

        expect(format(instant, 'Q')).toEqual('1');
    });

    it('is able to format PlainDate', () => {
        const plainDate = Temporal.PlainDate.from('2024-02-24');

        expect(format(plainDate, 'YY')).toEqual('24');
        expect(format(plainDate, 'YYYY')).toEqual('2024');

        expect(format(plainDate, 'M')).toEqual('2');
        expect(format(plainDate, 'MM')).toEqual('02');
        expect(format(plainDate, 'MMM')).toEqual('Feb');
        expect(format(plainDate, 'MMM', 'nl')).toEqual('feb');
        expect(format(plainDate, 'MMMM')).toEqual('February');
        expect(format(plainDate, 'MMMM', 'nl')).toEqual('februari');

        expect(format(plainDate, 'D')).toEqual('24');
        expect(format(plainDate, 'DD')).toEqual('24');
        expect(format(plainDate, 'Do')).toEqual('24th');
        expect(format(plainDate, 'd')).toEqual('6');
        expect(format(plainDate, 'dd')).toEqual('S');
        expect(format(plainDate, 'dd', 'nl')).toEqual('Z');
        expect(format(plainDate, 'ddd')).toEqual('Sat');
        expect(format(plainDate, 'ddd', 'nl')).toEqual('za');
        expect(format(plainDate, 'dddd')).toEqual('Saturday');
        expect(format(plainDate, 'dddd', 'nl')).toEqual('zaterdag');

        expect(format(plainDate, 'W')).toEqual('8');
        expect(format(plainDate, 'w')).toEqual('8');
        expect(format(plainDate, 'Wo')).toEqual('8th');
        expect(format(plainDate, 'WW')).toEqual('08');
        expect(format(plainDate, 'ww')).toEqual('08');

        expect(format(plainDate, 'H')).toEqual('0');
        expect(format(plainDate, 'HH')).toEqual('00');
        expect(format(plainDate, 'h')).toEqual('0');
        expect(format(plainDate, 'hh')).toEqual('00');
        expect(format(plainDate, 'k')).toEqual('1');
        expect(format(plainDate, 'kk')).toEqual('01');

        expect(format(plainDate, 'm')).toEqual('0');
        expect(format(plainDate, 'mm')).toEqual('00');

        expect(format(plainDate, 's')).toEqual('0');
        expect(format(plainDate, 'ss')).toEqual('00');

        expect(format(plainDate, 'X')).toEqual('1708732800');
        expect(format(plainDate, 'x')).toEqual('1708732800000');

        expect(format(plainDate, 'SSS')).toEqual('000');
        expect(format(plainDate, 'SSSS')).toEqual('000');

        expect(format(plainDate, 'Z')).toEqual('+00:00');
        expect(format(plainDate, 'z')).toEqual('UTC');
        expect(format(plainDate, 'ZZ')).toEqual('+0000');
        expect(format(plainDate, 'zzz')).toEqual('UTC');

        expect(format(plainDate, 'A')).toEqual('AM');
        expect(format(plainDate, 'a')).toEqual('am');

        expect(format(plainDate, 'Q')).toEqual('1');
    });

    it('is able to format PlainDateTime', () => {
        const plainDateTime = Temporal.PlainDateTime.from('2024-03-09T20:01:45');

        expect(format(plainDateTime, 'YY')).toEqual('24');
        expect(format(plainDateTime, 'YYYY')).toEqual('2024');

        expect(format(plainDateTime, 'M')).toEqual('3');
        expect(format(plainDateTime, 'MM')).toEqual('03');
        expect(format(plainDateTime, 'MMM')).toEqual('Mar');
        expect(format(plainDateTime, 'MMM', 'nl')).toEqual('mrt');
        expect(format(plainDateTime, 'MMMM')).toEqual('March');
        expect(format(plainDateTime, 'MMMM', 'nl')).toEqual('maart');

        expect(format(plainDateTime, 'D')).toEqual('9');
        expect(format(plainDateTime, 'DD')).toEqual('09');
        expect(format(plainDateTime, 'Do')).toEqual('9th');
        expect(format(plainDateTime, 'd')).toEqual('6');
        expect(format(plainDateTime, 'dd')).toEqual('S');
        expect(format(plainDateTime, 'dd', 'nl')).toEqual('Z');
        expect(format(plainDateTime, 'ddd')).toEqual('Sat');
        expect(format(plainDateTime, 'ddd', 'nl')).toEqual('za');
        expect(format(plainDateTime, 'dddd')).toEqual('Saturday');
        expect(format(plainDateTime, 'dddd', 'nl')).toEqual('zaterdag');

        expect(format(plainDateTime, 'W')).toEqual('10');
        expect(format(plainDateTime, 'w')).toEqual('10');
        expect(format(plainDateTime, 'Wo')).toEqual('10th');
        expect(format(plainDateTime, 'WW')).toEqual('10');
        expect(format(plainDateTime, 'ww')).toEqual('10');

        expect(format(plainDateTime, 'H')).toEqual('20');
        expect(format(plainDateTime, 'HH')).toEqual('20');
        expect(format(plainDateTime, 'h')).toEqual('8');
        expect(format(plainDateTime, 'hh')).toEqual('08');
        expect(format(plainDateTime, 'k')).toEqual('21');
        expect(format(plainDateTime, 'kk')).toEqual('21');

        expect(format(plainDateTime, 'm')).toEqual('1');
        expect(format(plainDateTime, 'mm')).toEqual('01');

        expect(format(plainDateTime, 's')).toEqual('45');
        expect(format(plainDateTime, 'ss')).toEqual('45');

        expect(format(plainDateTime, 'X')).toEqual('1710014505');
        expect(format(plainDateTime, 'x')).toEqual('1710014505000');

        expect(format(plainDateTime, 'SSS')).toEqual('000');
        expect(format(plainDateTime, 'SSSS')).toEqual('000');

        expect(format(plainDateTime, 'Z')).toEqual('+00:00');
        expect(format(plainDateTime, 'z')).toEqual('UTC');
        expect(format(plainDateTime, 'ZZ')).toEqual('+0000');
        expect(format(plainDateTime, 'zzz')).toEqual('UTC');

        expect(format(plainDateTime, 'A')).toEqual('PM');
        expect(format(plainDateTime, 'a')).toEqual('pm');

        expect(format(plainDateTime, 'Q')).toEqual('1');
    });

    it('is able to format PlainTime', () => {
        const plainTime = Temporal.PlainTime.from('13:37');

        expect(format(plainTime, 'YY')).toEqual('70');
        expect(format(plainTime, 'YYYY')).toEqual('1970');

        expect(format(plainTime, 'M')).toEqual('1');
        expect(format(plainTime, 'MM')).toEqual('01');
        expect(format(plainTime, 'MMM')).toEqual('Jan');
        expect(format(plainTime, 'MMM', 'nl')).toEqual('jan');
        expect(format(plainTime, 'MMMM')).toEqual('January');
        expect(format(plainTime, 'MMMM', 'nl')).toEqual('januari');

        expect(format(plainTime, 'D')).toEqual('1');
        expect(format(plainTime, 'DD')).toEqual('01');
        expect(format(plainTime, 'Do')).toEqual('1st');
        expect(format(plainTime, 'd')).toEqual('4');
        expect(format(plainTime, 'dd')).toEqual('T');
        expect(format(plainTime, 'dd', 'nl')).toEqual('D');
        expect(format(plainTime, 'ddd')).toEqual('Thu');
        expect(format(plainTime, 'ddd', 'nl')).toEqual('do');
        expect(format(plainTime, 'dddd')).toEqual('Thursday');
        expect(format(plainTime, 'dddd', 'nl')).toEqual('donderdag');

        expect(format(plainTime, 'W')).toEqual('53');
        expect(format(plainTime, 'w')).toEqual('53');
        expect(format(plainTime, 'Wo')).toEqual('53rd');
        expect(format(plainTime, 'WW')).toEqual('53');
        expect(format(plainTime, 'ww')).toEqual('53');

        expect(format(plainTime, 'H')).toEqual('13');
        expect(format(plainTime, 'HH')).toEqual('13');
        expect(format(plainTime, 'h')).toEqual('1');
        expect(format(plainTime, 'hh')).toEqual('01');
        expect(format(plainTime, 'k')).toEqual('14');
        expect(format(plainTime, 'kk')).toEqual('14');

        expect(format(plainTime, 'm')).toEqual('37');
        expect(format(plainTime, 'mm')).toEqual('37');

        expect(format(plainTime, 's')).toEqual('0');
        expect(format(plainTime, 'ss')).toEqual('00');

        expect(format(plainTime, 'X')).toEqual('49020');
        expect(format(plainTime, 'x')).toEqual('49020000');

        expect(format(plainTime, 'SSS')).toEqual('000');
        expect(format(plainTime, 'SSSS')).toEqual('000');

        expect(format(plainTime, 'Z')).toEqual('+00:00');
        expect(format(plainTime, 'z')).toEqual('UTC');
        expect(format(plainTime, 'ZZ')).toEqual('+0000');
        expect(format(plainTime, 'zzz')).toEqual('UTC');

        expect(format(plainTime, 'A')).toEqual('PM');
        expect(format(plainTime, 'a')).toEqual('pm');

        expect(format(plainTime, 'Q')).toEqual('1');
    });

    it('is able to format ZonedDateTime', () => {
        const zonedDateTime =
            Temporal.Instant.from('2024-06-05T12:30:00Z').toZonedDateTimeISO('Europe/Amsterdam');

        expect(format(zonedDateTime, 'YY')).toEqual('24');
        expect(format(zonedDateTime, 'YYYY')).toEqual('2024');

        expect(format(zonedDateTime, 'M')).toEqual('6');
        expect(format(zonedDateTime, 'MM')).toEqual('06');
        expect(format(zonedDateTime, 'MMM')).toEqual('Jun');
        expect(format(zonedDateTime, 'MMM', 'nl')).toEqual('jun');
        expect(format(zonedDateTime, 'MMMM')).toEqual('June');
        expect(format(zonedDateTime, 'MMMM', 'nl')).toEqual('juni');

        expect(format(zonedDateTime, 'D')).toEqual('5');
        expect(format(zonedDateTime, 'DD')).toEqual('05');
        expect(format(zonedDateTime, 'Do')).toEqual('5th');
        expect(format(zonedDateTime, 'd')).toEqual('3');
        expect(format(zonedDateTime, 'dd')).toEqual('W');
        expect(format(zonedDateTime, 'dd', 'nl')).toEqual('W');
        expect(format(zonedDateTime, 'ddd')).toEqual('Wed');
        expect(format(zonedDateTime, 'ddd', 'nl')).toEqual('wo');
        expect(format(zonedDateTime, 'dddd')).toEqual('Wednesday');
        expect(format(zonedDateTime, 'dddd', 'nl')).toEqual('woensdag');

        expect(format(zonedDateTime, 'W')).toEqual('23');
        expect(format(zonedDateTime, 'w')).toEqual('23');
        expect(format(zonedDateTime, 'Wo')).toEqual('23rd');
        expect(format(zonedDateTime, 'WW')).toEqual('23');
        expect(format(zonedDateTime, 'ww')).toEqual('23');

        expect(format(zonedDateTime, 'H')).toEqual('14');
        expect(format(zonedDateTime, 'HH')).toEqual('14');
        expect(format(zonedDateTime, 'h')).toEqual('2');
        expect(format(zonedDateTime, 'hh')).toEqual('02');
        expect(format(zonedDateTime, 'k')).toEqual('15');
        expect(format(zonedDateTime, 'kk')).toEqual('15');

        expect(format(zonedDateTime, 'm')).toEqual('30');
        expect(format(zonedDateTime, 'mm')).toEqual('30');

        expect(format(zonedDateTime, 's')).toEqual('0');
        expect(format(zonedDateTime, 'ss')).toEqual('00');

        expect(format(zonedDateTime, 'X')).toEqual('1717590600');
        expect(format(zonedDateTime, 'x')).toEqual('1717590600000');

        expect(format(zonedDateTime, 'SSS')).toEqual('000');
        expect(format(zonedDateTime, 'SSSS')).toEqual('000');

        expect(format(zonedDateTime, 'Z')).toEqual('+02:00');
        expect(format(zonedDateTime, 'z')).toEqual('Europe/Amsterdam');
        expect(format(zonedDateTime, 'ZZ')).toEqual('+0200');
        expect(format(zonedDateTime, 'zzz')).toEqual('Europe/Amsterdam');

        expect(format(zonedDateTime, 'A')).toEqual('PM');
        expect(format(zonedDateTime, 'a')).toEqual('pm');

        expect(format(zonedDateTime, 'Q')).toEqual('2');
    });
});
