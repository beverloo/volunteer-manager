// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Temporal } from '@lib/Temporal';

/**
 * Type definition for the contents of an availability window, including its override.
 */
export type AvailabilityWindow = {
    /**
     * Moment at which the availability window opens, if any.
     */
    start?: Temporal.ZonedDateTime;

    /**
     * Moment at which the availability window closes, if any.
     */
    end?: Temporal.ZonedDateTime;

    /**
     * Whether an override is in play for the signed in user.
     */
    override?: boolean;
}

/**
 * Utility function to determine whether the given availabiltiy `window` is currently open.
 */
export function isAvailabilityWindowOpen(window?: AvailabilityWindow): boolean {
    if (!window || (!window.start && !window.end))
        return false;  // on window has been defined

    if (typeof window.override === 'boolean')
        return window.override;  // an override has been imposed

    const currentTime = Temporal.Now.zonedDateTimeISO();
    if (!!window.start && Temporal.ZonedDateTime.compare(window.start, currentTime) > 0)
        return false;  // the window has not opened yet

    if (!!window.end && Temporal.ZonedDateTime.compare(window.end, currentTime) <= 0)
        return false;  // the window has finished already

    return true;
}
