// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Temporal } from 'temporal-polyfill';
export { Temporal };

/**
 * Regular expression using which we parse the format passed to the `format` function. This is
 * copied directly from the DayJS repository, which is MIT licensed much like ourselves.
 *
 * @see https://github.com/iamkun/dayjs/blob/dev/src/constant.js
 */
const kFormatRegexp =
    /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSSS|SSS/g;

/**
 * Formats the given `dateTime` to a string according to the indicated `format`. The implementation
 * of this formatter follows the basic formatting rules of the DayJS library.
 *
 * `Instant`, `PlainDate`, `PlainDateTime` and `PlainTime` will be interpret as if they were in UTC,
 * whereas `ZonedDateTime` will maintain its associated timezone.
 *
 * @see https://day.js.org/docs/en/display/format
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
        zonedDateTime = dateTime.toZonedDateTime({ timeZone: 'UTC' });
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
            case 'dd':
                return zonedDateTime.toLocaleString(effectiveLocale, { weekday: 'narrow' });
            case 'ddd':
                return zonedDateTime.toLocaleString(effectiveLocale, { weekday: 'short' });
            case 'dddd':
                return zonedDateTime.toLocaleString(effectiveLocale, { weekday: 'long' });

            case 'H':
                return `${fields.isoHour}`;
            case 'HH':
                return `0${fields.isoHour}`.substr(-2);
            case 'h':
                return `${fields.isoHour % 12}`;
            case 'hh':
                return `0${fields.isoHour % 12}`.substr(-2);

            case 'm':
                return `${fields.isoMinute}`;
            case 'mm':
                return `0${fields.isoMinute}`.substr(-2);

            case 's':
                return `${fields.isoSecond}`;
            case 'ss':
                return `0${fields.isoSecond}`.substr(-2);

            case 'SSS':
                return `00${fields.isoMillisecond}`.substr(-3);
            case 'SSSS':
                return `00${fields.isoMicrosecond}`.substr(-3);

            case 'Z':
                return fields.offset;
            case 'ZZ':
                return fields.offset.replace(':', '');

            case 'A':
                return fields.isoHour < 12 ? 'AM' : 'PM';
            case 'a':
                return fields.isoHour < 12 ? 'am' : 'pm';

            default:
                throw new Error(`Invalid formatting parameter received (f=${format}, v=${match})`);
        }
    };

    return format.replace(kFormatRegexp, (match, $1) => $1 || matches(match));
}
