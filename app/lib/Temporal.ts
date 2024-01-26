// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Temporal } from 'temporal-polyfill';
export { Temporal };

/**
 * Regular expression using which we parse the format passed to the `format` function. It combines
 * the original expression with the one used in the _advancedFormat_ plugin, as we support both.
 *
 * @see https://github.com/iamkun/dayjs/blob/dev/src/constant.js
 * @see https://github.com/iamkun/dayjs/blob/dev/src/plugin/advancedFormat/index.js
 */
const kFormatRegexp =
    /\[([^\]]+)]|Y{1,4}|M{1,4}|Do|D{1,2}|d{1,4}|Wo|W{1,2}|w{1,2}|H{1,2}|h{1,2}|k{1,2}|a|A|m{1,2}|s{1,2}|x|X|Z{1,2}|zzz|z|SSSS|SSS|Q/g;

/**
 * Returns the given `value` as a number witn an ordinal. I.e. "1" -> "1st", "4" -> "4th", etc.
 * @see https://stackoverflow.com/a/31615643
 */
function withOrdinal(number: number): string {
    const suffices = [ 'th', 'st', 'nd', 'rd' ];
    const value = number % 100;

    return value + (suffices[ (value - 20) % 10 ] || suffices[value] || suffices[0]);
}

/**
 * Formats the given `dateTime` to a string according to the indicated `format`. The implementation
 * of this formatter follows the basic formatting rules of the DayJS library.
 *
 * `Instant`, `PlainDate`, `PlainDateTime` and `PlainTime` will be interpret as if they were in UTC,
 * whereas `ZonedDateTime` will maintain its associated timezone.
 *
 * Format | Output                | Description
 * -------|-----------------------|--------------------------------------
 * YY     | 18                    | Two-digit year
 * YYYY   | 2018                  | Four-digit year
 * M      | 1 - 12                | The month, beginning at 1
 * MM     | 01 - 12               | The month, 2-digits
 * MMM    | Jan - Dec             | The abbreviated month name
 * MMMM   | January - December    | The full month name
 * D      | 1 - 31                | The day of the month
 * DD     | 01 - 31               | The day of the month, 2-digits
 * Do     | 1st 2nd ... 31st      | Day of Month with ordinal
 * d      | 0 - 6                 | The day of the week, with Sunday as 0
 * dd     | Su - Sa               | The min name of the day of the week
 * ddd    | Sun - Sat             | The short name of the day of the week
 * dddd   | Sunday - Saturday     | The name of the day of the week
 * w      | 1 2 ... 52 53         | Week of year
 * ww     | 01 02 ... 52 53       | Week of year, 2-digits
 * Wo     | 1st 2nd ... 52nd 53rd | Week of year with ordinal
 * W      | 1 2 ... 52 53         | ISO Week of year
 * WW     | 01 02 ... 52 53       | ISO Week of year, 2-digits
 * H      | 0 - 23                | The hour
 * HH     | 00 - 23               | The hour, 2-digits
 * h      | 1 - 12                | The hour, 12-hour clock
 * hh     | 01 - 12               | The hour, 12-hour clock, 2-digits
 * k      | 1 - 24                | The hour, beginning at 1
 * kk     | 01 - 24               | The hour, 2-digits, beginning at 1
 * m      | 0 - 59                | The minute
 * mm     | 00 - 59               | The minute, 2-digits
 * s      | 0 - 59                | The second
 * ss     | 00 - 59               | The second, 2-digits
 * X      | 1360013296            | Unix Timestamp in second
 * x      | 1360013296123         | Unix Timestamp in millisecond
 * SSS    | 000 - 999             | The millisecond, 3-digits
 * SSSS   | 000 - 999             | The microsecond, 3-digits
 * Z      | +05:00                | The offset from UTC, ±HH:mm
 * ZZ     | +0500                 | The offset from UTC, ±HHmm
 * z      | EST                   | Abbreviated named offset
 * zzz    | Eastern Standard Time | Unabbreviated named offset
 * A      | AM PM                 | Meridiem, in capitals
 * a      | am pm                 | Meridiem, in lowercase
 * Q      | 1 - 4                 | Quarter
 *
 * @see https://day.js.org/docs/en/display/format
 * @see https://day.js.org/docs/en/plugin/advanced-format
 */
export function format(dateTime: Temporal.Instant, format: string, locale?: string): string;
export function format(
    dateTime: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainTime,
    format: string, locale?: string): string;
export function format(dateTime: Temporal.ZonedDateTime, format: string, locale?: string): string;
export function format(dateTime: any, format: string, locale?: string): string {
    let zonedDateTime: Temporal.ZonedDateTime;

    if (dateTime instanceof Temporal.Instant) {
        zonedDateTime = dateTime.toZonedDateTimeISO('UTC');
    } else if (dateTime instanceof Temporal.PlainDate) {
        zonedDateTime = dateTime.toZonedDateTime('UTC');
    } else if (dateTime instanceof Temporal.PlainDateTime) {
        zonedDateTime = dateTime.toZonedDateTime('UTC', { disambiguation: 'earlier' });
    } else if (dateTime instanceof Temporal.PlainTime) {
        zonedDateTime = dateTime.toZonedDateTime({
            plainDate: Temporal.PlainDate.from('1970-01-01'),
            timeZone: 'UTC',
        });
    } else if (dateTime instanceof Temporal.ZonedDateTime) {
        zonedDateTime = dateTime;
    } else {
        throw new Error(`Invalid value passed for DateTime (t=${typeof dateTime}, v=${dateTime})`);
    }

    const effectiveLocale = locale ?? 'en-GB';
    const fields = zonedDateTime.getISOFields();

    const matches = (match: string) => {
        switch (match) {
            case 'YY':
                return `${fields.isoYear}`.substr(2);
            case 'YYYY':
                return fields.isoYear;

            case 'M':
                return `${fields.isoMonth}`;
            case 'MM':
                return `0${fields.isoMonth}`.substr(-2);
            case 'MMM':
                return zonedDateTime.toLocaleString(effectiveLocale, { month: 'short' });
            case 'MMMM':
                return zonedDateTime.toLocaleString(effectiveLocale, { month: 'long' });

            case 'D':
                return `${fields.isoDay}`;
            case 'DD':
                return `0${fields.isoDay}`.substr(-2);
            case 'd':
                return `${zonedDateTime.dayOfWeek - 1}`;
            case 'Do':  // advancedFormat plugin
                return withOrdinal(fields.isoDay);
            case 'dd':
                return zonedDateTime.toLocaleString(effectiveLocale, { weekday: 'narrow' });
            case 'ddd':
                return zonedDateTime.toLocaleString(effectiveLocale, { weekday: 'short' });
            case 'dddd':
                return zonedDateTime.toLocaleString(effectiveLocale, { weekday: 'long' });

            case 'W':  // advancedFormat plugin
            case 'w':  // advancedFormat plugin
                return `${zonedDateTime.weekOfYear}`;
            case 'Wo':  // advancedFormat plugin
                return withOrdinal(zonedDateTime.weekOfYear);
            case 'WW':  // advancedFormat plugin
            case 'ww':  // advancedFormat plugin
                return `0${zonedDateTime.weekOfYear}`.substr(-2);

            case 'H':
                return `${fields.isoHour}`;
            case 'HH':
                return `0${fields.isoHour}`.substr(-2);
            case 'h':
                return `${fields.isoHour % 12}`;
            case 'hh':
                return `0${fields.isoHour % 12}`.substr(-2);
            case 'k':  // advancedFormat plugin
                return `${fields.isoHour + 1}`;
            case 'kk':  // advancedFormat plugin
                return `0${fields.isoHour + 1}`.substr(-2);

            case 'm':
                return `${fields.isoMinute}`;
            case 'mm':
                return `0${fields.isoMinute}`.substr(-2);

            case 's':
                return `${fields.isoSecond}`;
            case 'ss':
                return `0${fields.isoSecond}`.substr(-2);

            case 'X':  // advancedFormat plugin
                return `${zonedDateTime.epochSeconds}`;
            case 'x':  // advancedFormat plugin
                return `${zonedDateTime.epochMilliseconds}`;

            case 'SSS':
                return `00${fields.isoMillisecond}`.substr(-3);
            case 'SSSS':
                return `00${fields.isoMicrosecond}`.substr(-3);

            case 'Z':
                return fields.offset;
            case 'z':  // advancedFormat plugin
            case 'zzz':  // advancedFormat plugin
                return zonedDateTime.timeZoneId;
            case 'ZZ':
                return fields.offset.replace(':', '');

            case 'A':
                return fields.isoHour < 12 ? 'AM' : 'PM';
            case 'a':
                return fields.isoHour < 12 ? 'am' : 'pm';

            case 'Q':  // advancedFormat plugin
                return `${Math.ceil(fields.isoMonth / 3)}`;

            default:
                throw new Error(`Invalid formatting parameter received (f=${format}, v=${match})`);
        }
    };

    return format.replace(kFormatRegexp, (match, $1) => $1 || matches(match));
}
