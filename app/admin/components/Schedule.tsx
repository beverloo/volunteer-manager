// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import { Temporal } from '@lib/Temporal';

import '@beverloo/volunteer-manager-timeline/dist/volunteer-manager-timeline.css';
import { Schedule as ScheduleInternal } from '@beverloo/volunteer-manager-timeline';
import type { ScheduleProps as ScheduleInternalProps, ScheduleEvent, ScheduleEventMutation,
    ScheduleMarker, ScheduleResource } from '@beverloo/volunteer-manager-timeline';

export type { ScheduleEvent, ScheduleEventMutation, ScheduleMarker, ScheduleResource };

/**
 * Props accepted by the <Schedule> event.
 */
export type ScheduleProps =
    Omit<ScheduleInternalProps, 'dataTimezone' | 'onError' | 'temporal' | 'theme'> & {
        /**
         * Subject to identify what this timeline is dealing with. Defaults to "event".
         */
        subject?: string;
    };

/**
 * The <Schedule> component displays a calendar timeline optimised for our scheduling purposes,
 * i.e. grouped resources vertically, and a time series horizontally. The component is optimised for
 * conveying large amounts of data, and real-time interaction between multiple people.
 */
export function Schedule(props: ScheduleProps) {
    const subject = props.subject ?? 'event';
    const theme = useTheme();

    const [ errorOpen, setErrorOpen ] = useState<boolean>(false);
    const [ errorMessage, setErrorMessage ] = useState<string | undefined>();
    const [ mounted, setMounted ] = useState<boolean>(false);

    useEffect(() => setMounted(true), [ /* no dependencies */ ]);

    const handleErrorClose = useCallback(() => setErrorOpen(false), [ /* no dependencies */ ]);
    const handleError = useCallback((action: 'create' | 'update', reason: 'invalid' | 'overlap') =>
    {
        switch (reason) {
            case 'invalid':
                setErrorMessage(`Cannot schedule the ${subject} at that time`);
                break;

            case 'overlap':
                setErrorMessage(`Cannot overlap with another ${subject}`);
                break;

            default:
                setErrorMessage('Something went wrong');
                break;
        }

        setErrorOpen(true);

    }, [ subject ]);

    // Only render timelines on the client, never on the server. This is meaningful because the
    // calendar component calculates text colour, which yields different results.
    if (!mounted)
        return null;

    return (
        <>
            <ScheduleInternal {...props} dataTimezone="utc" temporal={Temporal}
                              theme={theme.palette.mode} onError={handleError} />
            <Snackbar autoHideDuration={3000} onClose={handleErrorClose} open={errorOpen}>
                <Alert severity="error" variant="filled" sx={{ width: '100%' }}>
                    {errorMessage}
                </Alert>
            </Snackbar>
        </>
    );
}
