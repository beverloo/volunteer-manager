// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { createContext } from 'react';

/**
 * Context conveyed for the schedule app. This is updated periodically by the layout, which will
 * then be made available to each of the components within the schedule.
 */
export type ScheduleContextInfo = { /* todo */ };

/**
 * The <ScheduleContext> carries information about the schedule to display.
 */
export const ScheduleContext = createContext<ScheduleContextInfo | undefined>(
    /* unprovisioned= */ undefined);
