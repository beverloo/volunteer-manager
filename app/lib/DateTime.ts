// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { default as dayjs } from 'dayjs';

import { default as customParseFormat } from 'dayjs/plugin/customParseFormat';
import { default as relativeTime } from 'dayjs/plugin/relativeTime';
import { default as timezone } from 'dayjs/plugin/timezone';
import { default as updateLocale } from 'dayjs/plugin/updateLocale';
import { default as utc } from 'dayjs/plugin/utc';

export { default as dayjs } from 'dayjs';

dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(timezone);
dayjs.extend(updateLocale);
dayjs.extend(utc);

dayjs.updateLocale('en', {
    formats: {
        // abbreviated format options allowing localization
        LTS: 'H:mm:ss',
        LT: 'H:mm',
        L: 'YYYY-MM-DD',
        LL: 'MMMM D, YYYY',
        LLL: 'MMMM D, YYYY H:mm',
        LLLL: 'dddd, MMMM D, YYYY H:mm',

        // lowercase/short, optional formats for localization
        l: 'YYYY-MM-DD',
        ll: 'D MMM, YYYY',
        lll: 'D MMM, YYYY H:mm',
        llll: 'ddd, MMM D, YYYY H:mm'
    },
});

/**
 * Date and time representation that we use throughout the Volunteer Manager.
 */
export type DateTime = dayjs.Dayjs;

/**
 * Converts the given `date`, representing a particular date and time in the user's local timezone,
 * to a string representing that moment in UTC.
 */
export function fromLocalDate(date: Date, dateTimezone: string): string {
    return dayjs(date).tz(dateTimezone, true).toISOString();
}

/**
 * Converts the given `dayjs` to a local Date instance representing the correct date and time. This
 * function is intended to be used for editable fields in <DataTable> and <RemoteDataTable>.
 */
export function toLocalDate(date: string, dateTimezone: string): Date {
    return dayjs.utc(date).tz(dateTimezone).tz(undefined, true).toDate();
}
