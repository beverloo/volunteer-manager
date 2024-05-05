// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { createContext } from 'react';

import type { PublicSchedule } from '@app/api/event/schedule/getSchedule';

/**
 * Wrapper object to contain the schedule, as well as utility methods to interact with it.
 */
export interface ScheduleContextInfo {
    /**
     * Callback through which the schedule can be refreshed. A promise will be returned, but the
     * information conveyed therein is not exposed as part of this API.
     */
    refresh?: () => Promise<unknown>;

    /**
     * The schedule as sourced from the server. Contains both configuration as information.
     */
    schedule?: PublicSchedule;
}

/**
 * The <ScheduleContext> carries information about the schedule to display. It's sourced directly
 * from the server by the `ScheduleContextManager`, which also intends to keep it up-to-date.
 */
export const ScheduleContext = createContext<ScheduleContextInfo>({
    // no defaults
});
