// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useTheme } from '@mui/material/styles';

import { Temporal } from '@lib/Temporal';

import '@beverloo/volunteer-manager-timeline/dist/volunteer-manager-timeline.css';
import { Schedule as ScheduleInternal } from '@beverloo/volunteer-manager-timeline';
import type { ScheduleProps as ScheduleInternalProps, ScheduleMarker, ScheduleResource }
    from '@beverloo/volunteer-manager-timeline';

export type { ScheduleMarker, ScheduleResource };

/**
 * Props accepted by the <Schedule> event.
 */
export type ScheduleProps =
    Omit<ScheduleInternalProps, 'dataTimezone' | 'onError' | 'temporal' | 'theme'> & {
        /**
         * TODO
         */
    };

/**
 * The <Schedule> component displays a calendar timeline optimised for our scheduling purposes,
 * i.e. grouped resources vertically, and a time series horizontally. The component is optimised for
 * conveying large amounts of data, and real-time interaction between multiple people.
 */
export function Schedule(props: ScheduleProps) {
    const theme = useTheme();

    // TODO: Support `onError`

    return (
        <>
            <ScheduleInternal {...props} dataTimezone="utc" temporal={Temporal}
                              theme={theme.palette.mode} />
        </>
    );
}
