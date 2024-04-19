// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';

import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';

import type { PublicVendorSchedule } from '@app/api/event/schedule/getSchedule';
import { Temporal } from '@lib/Temporal';
import { Calendar, type CalendarEvent } from '@beverloo/volunteer-manager-timeline';
import '@beverloo/volunteer-manager-timeline/dist/volunteer-manager-timeline.css';

/**
 * Props accepted by the <CalendarPopover> component.
 */
export interface CalendarPopoverProps {
    /**
     * Whether the calendar should be opened.
     */
    open?: boolean;

    /**
     * The schedule that should be displayed on this calendar.
     */
    schedule: PublicVendorSchedule;

    /**
     * Timezone in which the calendar should be displayed.
     */
    timezone: string;

    /**
     * Title that should be shown on the popover.
     */
    title: string;

    /**
     * Called when the calendar should be closed.
     */
    onClose?: () => void;
}

/**
 * The <CalendarPopover> component displays a popover element containing a calendar.
 */
export default function CalendarPopover(props: CalendarPopoverProps) {
    const { open, onClose, schedule, timezone, title } = props;

    const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down('md'));
    const theme = useTheme();

    const { events, min, max } = useMemo(() => {
        const availableColours = [
            '#c9974e', '#925d65', '#6a7b73', '#a87059', '#cea19c',
            '#3288bd', '#154655', '#9e0142', '#66c2a5', '#e6f598'
        ];

        const events: CalendarEvent[] = [];
        let min: Temporal.Instant | undefined;
        let max: Temporal.Instant | undefined;

        let id = 0;
        for (const vendor of schedule) {
            const title = vendor.name;
            const color = availableColours.shift();

            for (const shift of vendor.shifts) {
                const startInstant = Temporal.Instant.fromEpochSeconds(shift.start);
                if (!min || min.epochSeconds > startInstant.epochSeconds)
                    min = startInstant;

                const endInstant = Temporal.Instant.fromEpochSeconds(shift.end);
                if (!max || max.epochSeconds < endInstant.epochSeconds)
                    max = endInstant;

                events.push({
                    id: id++,
                    start: startInstant.toString(),
                    end: endInstant.toString(),

                    title,
                    color,
                });
            }
        }

        return {
            events,
            min: min!.toZonedDateTimeISO(timezone).with({ hour: 0, minute: 0, second: 0 })
                .toString({ timeZoneName: 'never' }),
            max: max!.toZonedDateTimeISO(timezone).with({ hour: 23, minute: 59, second: 59 })
                .toString({ timeZoneName: 'never' }),
        };
    }, [ schedule, timezone ]);

    return (
        <Dialog open={!!open} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="md">
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <DialogTitle sx={{ pb: 0 }}>
                    {title}
                </DialogTitle>
                <Box sx={{ pr: 2 }}>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Stack>
            <Calendar displayTimezone={timezone} min={min} max={max} temporal={Temporal}
                      events={events} view={ isMobile ? 'mobile' : 'desktop' }
                      theme={theme.palette.mode} />
        </Dialog>
    );
}
