// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { createContext } from 'react';

import type { PublicSchedule } from '@app/api/event/schedule/getSchedule';

/**
 * The <ScheduleContext> carries information about the schedule to display. It's sourced directly
 * from the server by the `ScheduleContextManager`, which also intends to keep it up-to-date.
 */
export const ScheduleContext = createContext<PublicSchedule | undefined>(
    /* unprovisioned= */ undefined);
