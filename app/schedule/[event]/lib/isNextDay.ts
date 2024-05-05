// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { Temporal } from '@lib/Temporal';

/**
 * Returns whether the given `ref` `ZonedDateTime` is on the next day compared to the given
 * `currentDateTime`. This is computed now just based on day, but also based on the time, with an
 * assumption that the even breaks for the night.
 */
export function isNextDay(currentDateTime: Temporal.ZonedDateTime, ref: Temporal.ZonedDateTime) {
    if (currentDateTime.dayOfYear < ref.daysInYear)
        return true;  // case: `currentDateTime` is on an earlier day than `ref`

    if (currentDateTime.hour <= 3 && ref.hour >= 6)
        return true;  // case: `currentDateTime` is before 3am, whereas `ref` is on or after 6am

    return false;
}
