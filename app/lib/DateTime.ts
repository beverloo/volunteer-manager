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
 * The default timezone for the volunteer manager. Can be changed on a per-instance basis, but that
 * should generally be rare. Offsets are calculated from UTC.
 */
const kDefaultTimezone = 'Europe/Amsterdam';

/**
 * Unit to round down to when comparing two DateTime objects.
 */
export type DateTimeComparisonUnit =
    'year'   |  // The current year on January 1st, 00:00. (YYYY-01-01 00:00:00)
    'month'  |  // The current month at 00:00 on the first day. (YYYY-MM-01 00:00:00)
    'date'   |  // The current day at 00:00. (YYYY-MM-DD 00:00:00)
    'hour'   |  // The beginning of the current minute. (YYYY-MM-DD HH:00:00)
    'minute';   // The beginning of the current minute. (YYYY-MM-DD HH:mm:00)

/**
 * The `DateTime` class is the canonical API used throughout the Volunteer Portal when dealing with
 * dates and times. It has an immutable interface and supports timezones, formatting and comparisons
 * but does not assume or expose the underlying date/time library.
 *
 * Instances can be obtained in one of three ways: use `From()` to create one based on input that
 * is formatted according to ISO 8601 formats, `Parse()` to create one based on inputs in different
 * formats, or `Now()` to create one based on the current date and time.
 */
export class DateTime {
    // ---------------------------------------------------------------------------------------------
    // Section: Statics to obtain a DateTime instance
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns a new `DateTime` instance representing the given `input`. Three inputs are supported:
     * a string in a wide series of date representation formats, numbers as a unix timestamp in
     * seconds since January 1st, 1970 at UTC, and JavaScript `Date` objects.
     *
     * @param input The input time and date that should be parsed (ex. `2023-06-18T23:10:41`).
     * @param timezone The timezone according to which the time should be interpret.
     * @return An instance of the `DateTime` class representing that date.
     */
    static From(input: string | number | Date, timezone?: string): DateTime {
        return new DateTime(dayjs.tz(input, timezone ?? kDefaultTimezone));
    }

    /**
     * Returns a new `DateTime` instance representing the current time.
     *
     * @param timezone The timezone according to which the current time should be interpret.
     * @return An instance of the `DateTime` class representing the current time.
     */
    static Now(timezone?: string): DateTime {
        return new DateTime(dayjs.tz(undefined, timezone ?? kDefaultTimezone));
    }

    // ---------------------------------------------------------------------------------------------

    #value: dayjs.Dayjs;

    private constructor(value: dayjs.Dayjs) {
        this.#value = value;
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Getters.
    // ---------------------------------------------------------------------------------------------

    // ---------------------------------------------------------------------------------------------
    // Section: Comparison.
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns whether `this` represents a moment after `that`. Optionally the `unit` may be given,
     * which limits the scope of the comparison between the two moments.
     */
    isAfter(that: DateTime, unit?: DateTimeComparisonUnit): boolean {
        return this.#value.isAfter(that.value(), unit);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Internal, private behaviour.
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns the DayJS representation of the date contained within this instance. Must only be
     * used when dealing with comparisons or durations for functionality within this class.
     */
    private value(): dayjs.Dayjs {
        return this.#value;
    }
}
