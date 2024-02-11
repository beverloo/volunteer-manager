// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { TemporalAdapter, kDefaultLocale } from './TemporalAdapter';
import { Temporal } from './Temporal';

describe('TemporalAdapter', () => {
    it('is able to deal with configurable locales', () => {
        const defaultAdapter = new TemporalAdapter();
        expect(defaultAdapter.locale).toBe(kDefaultLocale);
        expect(defaultAdapter.getCurrentLocaleCode()).toBe(kDefaultLocale);
        expect(defaultAdapter.is12HourCycleInCurrentLocale()).toBeTrue();

        const britishAdapter = new TemporalAdapter({ locale: 'en-GB' });
        expect(britishAdapter.locale).toBe('en-GB');
        expect(britishAdapter.getCurrentLocaleCode()).toBe('en-GB');
        expect(defaultAdapter.is12HourCycleInCurrentLocale()).toBeTrue();

        const dutchAdapter = new TemporalAdapter({ locale: 'nl' });
        expect(dutchAdapter.locale).toBe('nl');
        expect(dutchAdapter.getCurrentLocaleCode()).toBe('nl');
        expect(dutchAdapter.is12HourCycleInCurrentLocale()).toBeFalse();
    });

    it('is able to parse input dates and times', () => {
        const adapter = new TemporalAdapter();

        // Valid options
        {
            expect(adapter.date(null)).toBe(null);
            expect(adapter.date()?.year).toBe(Temporal.Now.plainDateTimeISO().year);

            expect(adapter.date('2024-02-11T01:31:41+00:00[UTC]')?.year).toBe(2024);
            expect(adapter.dateWithTimezone(
                '2024-02-11T01:31:41+00:00[Europe/London]', 'Europe/London').year).toBe(2024);

            expect(adapter.date('2024-02-11T01:31:41+00:00')?.year).toBe(2024);
            expect(adapter.date('2024-02-11T01:31:41Z')?.year).toBe(2024);
        }

        // Invalid options (some may have to be supported)
        {
            expect(() => adapter.date('2024-02-11T01:31:41')).toThrow();
            expect(() => adapter.date('2024-02-11')).toThrow();
            expect(() => adapter.date('01:31:41')).toThrow();
        }
    });

    it('is able to format dates and times', () => {
        const defaultAdapter = new TemporalAdapter();
        // TODO: Test default formatting

        const customAdapter = new TemporalAdapter({
            formats: {
                keyboardDateTime: 'YYYY/MM/DD HH:mm:ss',
            },
        });

        // TODO: Test expanded formatting for `keyboardDateTime`

        const dutchAdapter = new TemporalAdapter({ locale: 'nl' });
        // TODO: Test localised formatting
    });
});
