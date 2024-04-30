// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';

import { Calendar, type CalendarEvent } from '@beverloo/volunteer-manager-timeline';
import '@beverloo/volunteer-manager-timeline/dist/volunteer-manager-timeline.css';

import type { DisplayShiftInfo } from '../DisplayContext';
import { Temporal } from '@lib/Temporal';

/**
 * Props accepted by the <VolunteersDialog> component.
 */
export interface VolunteersDialogProps {
    /**
     * Callback to call when the dialog should be closed.
     */
    onClose: () => void;

    /**
     * Whether the dialog should be opened.
     */
    open?: boolean;

    /**
     * Timezone in which any times should be displayed in the user interface.
     */
    timezone: string;

    /**
     * Volunteers that will be helping out in this location.
     */
    schedule: {
        past: DisplayShiftInfo[],
        active: DisplayShiftInfo[],
        future: DisplayShiftInfo[],
    },
}

/**
 * The <VolunteersDialog> component displays a sizeable dialog that provides access to the full
 * schedule of volunteers who are expected to help out at this location.
 */
export function VolunteersDialog(props: VolunteersDialogProps) {
    const { onClose, open, timezone, schedule } = props;

    // TODO: Compute the `events`:
    const events: CalendarEvent[] = [];

    // TODO: Compute the `min` and `max`:
    const min = '2023-06-09T00:00:00+02:00';
    const max = '2023-06-11T23:59:59+02:00';

    return (
        <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="md"
                sx={{
                    '& .mbsc-material-dark.mbsc-eventcalendar': {
                        backgroundColor: 'transparent',
                    },
                    '& .MuiPaper-root': {
                        maxHeight: '80vh !important',
                    },
                }}>

            <Calendar displayTimezone={timezone} min={min} max={max} temporal={Temporal}
                      events={events} view="mobile" theme="dark" />

        </Dialog>
    );
}
