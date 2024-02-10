// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { TemporalAdapter, kDefaultLocale } from './TemporalAdapter';

describe('TemporalAdapter', () => {
    it('is able to deal with configurable locales', () => {
        const defaultAdapter = new TemporalAdapter({ /* default locale */ });
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
});
