// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Type that describes the information we compose for the shift information cards on the overview
 * page of the Volunteer Portal. Composed from the schedule.
 */
export interface VolunteerShiftInfo {
    /**
     * UNIX timestamp, in seconds in UTC, at which the the shift will start.
     */
    startTime: number;

    /**
     * UNIX timestamp, in seconds in UTC, at which the the shift will end.
     */
    endTime: number;
}
