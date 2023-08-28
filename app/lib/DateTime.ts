// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { default as dayjs } from 'dayjs';

import { default as customParseFormat } from 'dayjs/plugin/customParseFormat';
import { default as timezone } from 'dayjs/plugin/timezone';
import { default as utc } from 'dayjs/plugin/utc';

export { default as dayjs } from 'dayjs';

dayjs.extend(customParseFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

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
 * Formatting rules for date & time representation supported by the `DateTime` class.
 */
export enum DateTimeFormat {
    /**
     * ISO 8601 representation carrying the date. (YYYY-MM-DD)
     */
    ISO8601_DATE = 'iso8601-date',

    /**
     * ISO 8601 representation carrying the date and time. (YYYY-MM-DD HH:mm:ss)
     */
    ISO8601_DATE_TIME = 'iso8601-date-time',

    /**
     * ISO 8601 representation carrying the date, time and timezone. (YYYY-MM-DDTHH:mm:ss+tz)
     */
    ISO8601_FULL = 'iso8601-full',

    /**
     * ISO 8601 representation carrying the time. (HH:mm:ss)
     */
    ISO8601_TIME = 'iso8601-time',
}

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
     * Returns a new `DateTime` instance representing the given `input`. The `format` describes how
     * the `input` should be parsed according to tokens canonical for Moment, DayJS and others.
     *
     * @see https://day.js.org/docs/en/parse/string-format#list-of-all-available-parsing-tokens
     * @param input The input time and date that should be parsed (ex. `23:10:41`).
     * @param format The format according to which the input should be parsed (ex. `HH:mm:ss`).
     * @param timezone The timezone according to which the time should be interpret.
     * @return An instance of the `DateTime` class representing that date.
     */
    static Parse(input: string, format: string, timezone?: string): DateTime {
        return new DateTime(dayjs.tz(input, format, timezone ?? kDefaultTimezone));
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

    /**
     * Returns the seconds (0-59) of the date stored within this instance.
     */
    get second(): number { return this.#value.second(); }

    /**
     * Returns the minute (0-59) of the date stored within this instance.
     */
    get minute(): number { return this.#value.minute(); }

    /**
     * Returns the hour (0-23) of the date stored within this instance.
     */
    get hour(): number { return this.#value.hour(); }

    /**
     * Returns the day of the month (0-31) of the date stored within this instance.
     */
    get date(): number { return this.#value.date(); }

    /**
     * Returns the month (1-12) of the date stored within this instance.
     */
    get month(): number { return this.#value.month() + 1; }

    /**
     * Returns the year (YYYY) of the date stored within this instance.
     */
    get year(): number { return this.#value.year(); }

    /**
     * Returns the UNIX timestamp of the date stored, in seconds since the epoch.
     */
    get unix(): number { return this.#value.unix(); }

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

    /**
     * Returns whether `this` represents a moment before `that`. Optionally the `unit` may be given,
     * which limits the scope of the comparison between the two moments.
     */
    isBefore(that: DateTime, unit?: DateTimeComparisonUnit): boolean {
        return this.#value.isBefore(that.value(), unit);
    }

    /**
     * Returns whether `this` represents the same moment as `that` at the scope indicated in the
     * `unit` argument. When `unit` is omitted, both need to represent the exact same moment.
     */
    isSame(that: DateTime, unit?: DateTimeComparisonUnit): boolean {
        return this.#value.isSame(that.value(), unit);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Formatting.
    // ---------------------------------------------------------------------------------------------

    /**
     * Formats the date stored within this instance according to the given `format`. A series of
     * representations are available, each defined within the `DateTimeFormat` enumeration.
     *
     * @param format The representation that should be used for formatting the date.
     * @return A string representing the stored date and time according to that format.
     */
    format(format: DateTimeFormat): string {
        switch (format) {
            case DateTimeFormat.ISO8601_DATE:
                return this.#value.format('YYYY-MM-DD');

            case DateTimeFormat.ISO8601_DATE_TIME:
                return this.#value.format('YYYY-MM-DD HH:mm:ss');

            case DateTimeFormat.ISO8601_FULL:
                return this.#value.format('YYYY-MM-DDTHH:mm:ssZ');

            case DateTimeFormat.ISO8601_TIME:
                return this.#value.format('HH:mm:ss');

            default:
                throw new Error(`Invalid date and time format requested: "${format}"`)
        }
    }

    /**
     * Returns a string representation of the stored date that will be used when this object is
     * serialized using `JSON.stringify`. Note that a reviver is necessary to re-instantiate |this|.
     */
    toJSON(): number { return this.#value.unix() * 1000; }

    /**
     * Returns a string representation of the stored date analogous to how JavaScript stringifies
     * other types of objects. Additional detail is added to enable debugging.
     */
    toString(): string {
        return `[object DateTime(${this.format(DateTimeFormat.ISO8601_FULL)})]`;
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
