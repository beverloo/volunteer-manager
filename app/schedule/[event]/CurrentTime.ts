// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { Temporal } from '@lib/Temporal';

declare module globalThis {
    let animeConTimeOffset: number;
    let animeConTimezone: string;
}

/**
 * Initialise the global time configuration to no offset, defaulting to UTC.
 */
globalThis.animeConTimeOffset = 0;
globalThis.animeConTimezone = 'utc';

/**
 * Returns the current time in a Temproal `Instant` representation.
 */
export function currentInstant(): Temporal.Instant {
    const currentInstant = Temporal.Now.instant();
    return !!globalThis.animeConTimeOffset
        ? currentInstant.add({ seconds: globalThis.animeConTimeOffset })
        : currentInstant;
}

/**
 * Returns the current time as a UNIX timestamp, represented in number of seconds since 1970 in UTC.
 */
export function currentTimestamp(): number {
    return currentInstant().epochSeconds;
}

/**
 * Return the current time in a Temporal `ZonedDateTime` representation.
 */
export function currentZonedDateTime(): Temporal.ZonedDateTime {
    return currentInstant().toZonedDateTimeISO(globalThis.animeConTimezone);
}

/**
 * Updates the default timezone to `timezone`, and the time offset to apply to the Volunteer Manager
 * to the given `offset`, indicated in seconds, if any.
 */
export function updateTimeConfig(offset: number | undefined, timezone: string): void {
    globalThis.animeConTimeOffset = offset ?? 0;
    globalThis.animeConTimezone = timezone;
}