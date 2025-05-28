// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Temporal } from '@lib/Temporal';
import { determineAvailabilityStatus } from './EnvironmentContext';

describe('EnvironmentContext', () => {

    it('should be able to correctly determine availability statuses', () => {
        const currentTime = Temporal.Now.zonedDateTimeISO('utc');

        const startInTheFuture = currentTime.add({ days: 1 });
        const startInThePast = currentTime.subtract({ days: 2 });
        const startUndefined = undefined;

        const endInTheFuture = currentTime.add({ days: 2 });
        const endInThePast = currentTime.subtract({ days: 1 });
        const endUndefined = undefined;

        // Past
        {
            expect(determineAvailabilityStatus(currentTime, {
                start: startInThePast,
                end: endInThePast,
                override: false,
            })).toBe('past');
        }

        // Active
        {
            expect(determineAvailabilityStatus(currentTime, {
                start: startInThePast,
                end: endInTheFuture,
                override: false,
            })).toBe('active');

            expect(determineAvailabilityStatus(currentTime, {
                start: startInThePast,
                end: endUndefined,
                override: false,
            })).toBe('active');
        }

        // Future
        {
            expect(determineAvailabilityStatus(currentTime, {
                start: startInTheFuture,
                end: endUndefined,
                override: false,
            })).toBe('future');

            expect(determineAvailabilityStatus(currentTime, {
                start: startUndefined,
                end: endUndefined,
                override: false,
            })).toBe('future');

            expect(determineAvailabilityStatus(currentTime, {
                start: startUndefined,
                end: endInTheFuture,
                override: false,
            })).toBe('future');
        }

        // Override
        {
            expect(determineAvailabilityStatus(currentTime, {
                start: startInThePast,
                end: endInThePast,
                override: true,  // <-- past becomes override
            })).toBe('override');

            expect(determineAvailabilityStatus(currentTime, {
                start: startUndefined,
                end: endUndefined,
                override: true,  // <-- future becomes override
            })).toBe('override');
        }
    });
});
