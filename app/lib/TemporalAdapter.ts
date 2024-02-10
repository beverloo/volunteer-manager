// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Temporal, formatDate } from './Temporal';

import type {
    FieldFormatTokenMap, MuiPickersAdapter, AdapterFormats, AdapterUnits, AdapterOptions,
    PickersTimezone, DateBuilderReturnType } from '@mui/x-date-pickers/models';

/**
 * Default locale to use when no explicit locale has been provided.
 */
export const kDefaultLocale = 'en';

/**
 * The format tokens that the Temporal adapter can deal with. This is based on the `formatDate()`
 * using which we format dates.
 */
const kFormatTokenMap: FieldFormatTokenMap = {
    // Year
    YY: 'year',
    YYYY: {
        sectionType: 'year',
        contentType: 'digit',
        maxLength: 4
    },

    // Month
    M: {
        sectionType: 'month',
        contentType: 'digit',
        maxLength: 2
    },
    MM: 'month',
    MMM: {
        sectionType: 'month',
        contentType: 'letter'
    },
    MMMM: {
        sectionType: 'month',
        contentType: 'letter'
    },

    // Day of the month
    D: {
        sectionType: 'day',
        contentType: 'digit',
        maxLength: 2
    },
    DD: 'day',
    Do: {
        sectionType: 'day',
        contentType: 'digit-with-letter'
    },

    // Day of the week
    d: {
        sectionType: 'weekDay',
        contentType: 'digit',
        maxLength: 2
    },
    dd: {
        sectionType: 'weekDay',
        contentType: 'letter'
    },
    ddd: {
        sectionType: 'weekDay',
        contentType: 'letter'
    },
    dddd: {
        sectionType: 'weekDay',
        contentType: 'letter'
    },
    // Meridiem
    A: 'meridiem',
    a: 'meridiem',

    // Hours
    H: {
        sectionType: 'hours',
        contentType: 'digit',
        maxLength: 2
    },
    HH: 'hours',
    h: {
        sectionType: 'hours',
        contentType: 'digit',
        maxLength: 2
    },
    hh: 'hours',

    // Minutes
    m: {
        sectionType: 'minutes',
        contentType: 'digit',
        maxLength: 2
    },
    mm: 'minutes',

    // Seconds
    s: {
        sectionType: 'seconds',
        contentType: 'digit',
        maxLength: 2
    },
    ss: 'seconds'
};

/**
 * The formats that can be used to transform dates to strings. Again dependent on the implementation
 * of the `formatDate()` function we provide as part of our Temporal implementation.
 */
const kFormats: AdapterFormats = {
    year: 'YYYY',
    month: 'MMMM',
    monthShort: 'MMM',
    dayOfMonth: 'D',
    weekday: 'dddd',
    weekdayShort: 'dd',
    hours24h: 'HH',
    hours12h: 'hh',
    meridiem: 'A',
    minutes: 'mm',
    seconds: 'ss',
    fullDate: 'll',
    fullDateWithWeekday: 'dddd, LL',
    keyboardDate: 'L',
    shortDate: 'MMM D',
    normalDate: 'D MMMM',
    normalDateWithWeekday: 'ddd, MMM D',
    monthAndYear: 'MMMM YYYY',
    monthAndDate: 'MMMM D',
    fullTime: 'LT',
    fullTime12h: 'hh:mm A',
    fullTime24h: 'HH:mm',
    fullDateTime: 'lll',
    fullDateTime12h: 'll hh:mm A',
    fullDateTime24h: 'll HH:mm',
    keyboardDateTime: 'L LT',
    keyboardDateTime12h: 'L hh:mm A',
    keyboardDateTime24h: 'L HH:mm'
};

/**
 * Implementation of the `MuiPickersAdapter` specific to the Temporal type. Both dates and times are
 * always represented by `Temporal.ZonedDateTime` rather than plain dates and times, as the
 * adapter's complexity would increase significantly by switching between these types.
 */
export class TemporalAdapter implements MuiPickersAdapter<Temporal.ZonedDateTime, string> {
    constructor(
        { locale, formats, instance }: AdapterOptions<string, typeof Temporal.ZonedDateTime>)
    {
        if (!!formats)
            throw new Error('TemporalAdapter::constructor({formats}) is not yet supported');

        if (!!instance)
            throw new Error('TemporalAdapter::constructor({instance}) is not yet supported');

        this.locale = locale ?? kDefaultLocale;
    }

    // ---------------------------------------------------------------------------------------------
    // Section: properties (public)
    // ---------------------------------------------------------------------------------------------

    escapedCharacters = { start: '[', end: ']' };
    formatTokenMap = kFormatTokenMap;
    formats = kFormats;
    isMUIAdapter = true;
    isTimezoneCompatible = true;
    lib = 'Temporal';
    locale: string;

    // ---------------------------------------------------------------------------------------------
    // Section: properties (private)
    // ---------------------------------------------------------------------------------------------

    private localeHourCycleCache = new Map<string, /* 12 hour cycle= */ boolean>();

    // ---------------------------------------------------------------------------------------------
    // Section: parsing and transformations
    // ---------------------------------------------------------------------------------------------

    date(value?: any): Temporal.ZonedDateTime | null {
        throw new Error('Method not implemented.');
    }

    dateWithTimezone<T extends string | null | undefined>(value: T, timezone: string)
        : DateBuilderReturnType<T, Temporal.ZonedDateTime>
    {
        throw new Error('Method not implemented.');
    }

    isNull(value: Temporal.ZonedDateTime | null): boolean {
        throw new Error('Method not implemented.');
    }

    isValid(value: any): boolean {
        throw new Error('Method not implemented.');
    }

    parseISO(isoString: string): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    parse(value: string, format: string): Temporal.ZonedDateTime | null {
        throw new Error('Method not implemented.');
    }

    toISO(value: Temporal.ZonedDateTime): string {
        throw new Error('Method not implemented.');
    }

    toJsDate(value: Temporal.ZonedDateTime): Date {
        throw new Error('Method not implemented.');
    }

    // ---------------------------------------------------------------------------------------------
    // Section: locale
    // ---------------------------------------------------------------------------------------------

    getCurrentLocaleCode(): string { return this.locale; }

    is12HourCycleInCurrentLocale(): boolean {
        if (this.localeHourCycleCache.has(this.locale))
            return !!this.localeHourCycleCache.get(this.locale);

        const formattedTime = new Intl.DateTimeFormat(this.locale, { timeStyle: 'long' })
            .format(new Date(2024, 1, 1, 15, 0, 0));

        const is12HourCycle = formattedTime.includes('3');
        this.localeHourCycleCache.set(this.locale, is12HourCycle);

        return is12HourCycle;
    }

    // ---------------------------------------------------------------------------------------------
    // Section: formatting
    // ---------------------------------------------------------------------------------------------

    expandFormat(format: string): string {
        throw new Error('Method not implemented.');
    }

    format(value: Temporal.ZonedDateTime, formatKey: keyof AdapterFormats): string {
        throw new Error('Method not implemented.');
    }

    formatByString(value: Temporal.ZonedDateTime, formatString: string): string {
        throw new Error('Method not implemented.');
    }

    formatNumber(numberToFormat: string): string {
        throw new Error('Method not implemented.');
    }

    getFormatHelperText(format: string): string {
        throw new Error('Method not implemented.');
    }

    // ---------------------------------------------------------------------------------------------
    // Section: manipulation
    // ---------------------------------------------------------------------------------------------

    getTimezone(value: Temporal.ZonedDateTime | null): string {
        throw new Error('Method not implemented.');
    }

    setTimezone(value: Temporal.ZonedDateTime, timezone: PickersTimezone): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    addYears(value: Temporal.ZonedDateTime, amount: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    addMonths(value: Temporal.ZonedDateTime, amount: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    addWeeks(value: Temporal.ZonedDateTime, amount: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    addDays(value: Temporal.ZonedDateTime, amount: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    addHours(value: Temporal.ZonedDateTime, amount: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    addMinutes(value: Temporal.ZonedDateTime, amount: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    addSeconds(value: Temporal.ZonedDateTime, amount: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    startOfYear(value: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    startOfMonth(value: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    startOfWeek(value: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    startOfDay(value: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    endOfYear(value: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    endOfMonth(value: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    endOfWeek(value: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    endOfDay(value: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    // ---------------------------------------------------------------------------------------------
    // Section: comparisons
    // ---------------------------------------------------------------------------------------------

    isEqual(value: any, comparing: any): boolean {
        throw new Error('Method not implemented.');
    }

    isSameYear(value: Temporal.ZonedDateTime, comparing: Temporal.ZonedDateTime): boolean {
        throw new Error('Method not implemented.');
    }

    isSameMonth(value: Temporal.ZonedDateTime, comparing: Temporal.ZonedDateTime): boolean {
        throw new Error('Method not implemented.');
    }

    isSameDay(value: Temporal.ZonedDateTime, comparing: Temporal.ZonedDateTime): boolean {
        throw new Error('Method not implemented.');
    }

    isSameHour(value: Temporal.ZonedDateTime, comparing: Temporal.ZonedDateTime): boolean {
        throw new Error('Method not implemented.');
    }

    isAfter(value: Temporal.ZonedDateTime, comparing: Temporal.ZonedDateTime): boolean {
        throw new Error('Method not implemented.');
    }

    isAfterYear(value: Temporal.ZonedDateTime, comparing: Temporal.ZonedDateTime): boolean {
        throw new Error('Method not implemented.');
    }

    isAfterDay(value: Temporal.ZonedDateTime, comparing: Temporal.ZonedDateTime): boolean {
        throw new Error('Method not implemented.');
    }

    isBefore(value: Temporal.ZonedDateTime, comparing: Temporal.ZonedDateTime): boolean {
        throw new Error('Method not implemented.');
    }

    isBeforeYear(value: Temporal.ZonedDateTime, comparing: Temporal.ZonedDateTime): boolean {
        throw new Error('Method not implemented.');
    }

    isBeforeDay(value: Temporal.ZonedDateTime, comparing: Temporal.ZonedDateTime): boolean {
        throw new Error('Method not implemented.');
    }

    isWithinRange(
        value: Temporal.ZonedDateTime,
        range: [ Temporal.ZonedDateTime, Temporal.ZonedDateTime ]): boolean
    {
        throw new Error('Method not implemented.');
    }

    // ---------------------------------------------------------------------------------------------
    // Section: difference
    // ---------------------------------------------------------------------------------------------

    getDiff(
        value: Temporal.ZonedDateTime,
        comparing: string | Temporal.ZonedDateTime,
        unit?: AdapterUnits | undefined): number
    {
        throw new Error('Method not implemented.');
    }

    // ---------------------------------------------------------------------------------------------
    // Section: getters
    // ---------------------------------------------------------------------------------------------

    getYear(value: Temporal.ZonedDateTime): number {
        throw new Error('Method not implemented.');
    }

    getMonth(value: Temporal.ZonedDateTime): number {
        throw new Error('Method not implemented.');
    }

    getDate(value: Temporal.ZonedDateTime): number {
        throw new Error('Method not implemented.');
    }

    getHours(value: Temporal.ZonedDateTime): number {
        throw new Error('Method not implemented.');
    }

    getMinutes(value: Temporal.ZonedDateTime): number {
        throw new Error('Method not implemented.');
    }

    getSeconds(value: Temporal.ZonedDateTime): number {
        throw new Error('Method not implemented.');
    }

    getMilliseconds(value: Temporal.ZonedDateTime): number {
        throw new Error('Method not implemented.');
    }

    getWeekNumber(value: Temporal.ZonedDateTime): number {
        throw new Error('Method not implemented.');
    }

    // ---------------------------------------------------------------------------------------------
    // Section: setters
    // ---------------------------------------------------------------------------------------------

    setYear(value: Temporal.ZonedDateTime, year: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    setMonth(value: Temporal.ZonedDateTime, month: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    setDate(value: Temporal.ZonedDateTime, date: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    setHours(value: Temporal.ZonedDateTime, hours: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    setMinutes(value: Temporal.ZonedDateTime, minutes: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    setSeconds(value: Temporal.ZonedDateTime, seconds: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    setMilliseconds(value: Temporal.ZonedDateTime, milliseconds: number): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    // ---------------------------------------------------------------------------------------------
    // Section: misc
    // ---------------------------------------------------------------------------------------------

    getDaysInMonth(value: Temporal.ZonedDateTime): number {
        throw new Error('Method not implemented.');
    }

    getNextMonth(value: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    getPreviousMonth(value: Temporal.ZonedDateTime): Temporal.ZonedDateTime {
        throw new Error('Method not implemented.');
    }

    getMonthArray(value: Temporal.ZonedDateTime): Temporal.ZonedDateTime[] {
        throw new Error('Method not implemented.');
    }

    mergeDateAndTime(dateParam: Temporal.ZonedDateTime, timeParam: Temporal.ZonedDateTime)
        : Temporal.ZonedDateTime
    {
        throw new Error('Method not implemented.');
    }

    getWeekdays(): string[] {
        throw new Error('Method not implemented.');
    }

    getWeekArray(value: Temporal.ZonedDateTime): Temporal.ZonedDateTime[][] {
        throw new Error('Method not implemented.');
    }

    getYearRange(start: Temporal.ZonedDateTime, end: Temporal.ZonedDateTime)
        : Temporal.ZonedDateTime[]
    {
        throw new Error('Method not implemented.');
    }

    getMeridiemText(meridiem: 'am' | 'pm'): string {
        throw new Error('Method not implemented.');
    }
}
