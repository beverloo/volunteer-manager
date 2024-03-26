// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import React, { createContext, useCallback, useMemo, useState } from 'react';

import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import PeopleIcon from '@mui/icons-material/People';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';

import type { PageInfoWithTeam } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { SectionHeader } from '@app/admin/components/SectionHeader';
import { Temporal, formatDate } from '@lib/Temporal';
import { callApi } from '@lib/callApi';

/**
 * Information regarding the schedule context.
 */
export interface ScheduleInfo {
    /**
     * The date (in a Temporal PlainDate-compatible format) that the schedule should focus on.
     */
    date?: string;

    /**
     * Whether it should be possible to schedule shifts owned by the other teams.
     */
    inclusiveShifts: boolean;
}

/**
 * Export the context through which schedule settings will be managed. Settings will persist across
 * browsing sessions for the signed in user.
 */
export const ScheduleContext = createContext<ScheduleInfo>({
    date: undefined,
    inclusiveShifts: false,
});

/**
 * Props accepted by the <ScheduleContextImpl> component.
 */
export interface ScheduleContextImplProps {
    /**
     * Information about the event for which the schedule is being shown.
     */
    event: PageInfoWithTeam['event'];

    /**
     * Information about the team for which the schedule is being shown.
     */
    team: PageInfoWithTeam['team'];

    /**
     * Default values that should be set in the context.
     */
    defaultContext: ScheduleInfo;
}

/**
 * The <ScheduleContextImpl> component hosts the schedule context, based on which the views that are
 * part of this tool will operate. Visibility of specific days and other teams is part of that.
 */
export function ScheduleContextImpl(props: React.PropsWithChildren<ScheduleContextImplProps>) {
    const { defaultContext } = props;

    // Computes the dates that are available within the schedule—based within the event's start and
    // end dates included in `props.event`. Will be represented as a Set of strings.
    const availableDays = useMemo(() => {
        const firstDay = Temporal.ZonedDateTime.from(props.event.startTime).toPlainDate();
        const lastDay = Temporal.ZonedDateTime.from(props.event.endTime).toPlainDate();

        const availableDays: { date: string, label: string }[] = [];

        if (Temporal.PlainDate.compare(firstDay, lastDay) >= 0)
            throw new Error(`Cannot show available dates when ${firstDay} comes before ${lastDay}`);

        let currentDay = firstDay;
        while (Temporal.PlainDate.compare(currentDay, lastDay) <= 0) {
            availableDays.push({
                date: currentDay.toString(),
                label: formatDate(currentDay, 'dddd'),
            });

            currentDay = currentDay.add({ days: 1 });
        }

        return availableDays;

    }, [ props.event ]);

    // Initialise the state based on the `props`. The `date` will be validated on initialisation as
    // the setting may be persisted across events.
    const [ inclusiveShifts, setInclusiveShifts ] = useState(defaultContext.inclusiveShifts);
    const [ date, setDate ] = useState<string | undefined>(() => {
        for (const { date } of availableDays) {
            if (date === props.defaultContext.date)
                return date;
        }

        return undefined;
    });

    // Called when the selected `date` has changed. The given `date` may either be a string when a
    // particular button has been selected, or `undefined` when all buttons have been unselected.
    const handleDateChange = useCallback((event: unknown, date?: string) => {
        setDate(date ?? undefined);
        callApi('post', '/api/auth/settings', { 'user-admin-schedule-date': date || '' })
            .catch(error => console.error(`Unable to save a setting: ${error}`))

    }, [ /* no dependencies */ ]);

    // Called when the inclusive shifts setting has changed. This means that shifts from other teams
    // can now be scheduled for volunteers in this team.
    const handleInclusiveShiftsChange = useCallback((event: unknown, inclusiveShifts: boolean) => {
        setInclusiveShifts(!!inclusiveShifts);
        callApi('post', '/api/auth/settings', {
            'user-admin-schedule-inclusive-shifts': inclusiveShifts
        }).catch(error => console.error(`Unable to save a setting: ${error}`))

    }, [ /* no dependencies */ ]);

    const scheduleContext: ScheduleInfo =
        useMemo(() => ({ date, inclusiveShifts }), [ date, inclusiveShifts ]);

    return (
        <ScheduleContext.Provider value={scheduleContext}>
            <Stack component={Paper} direction="row" spacing={2} sx={{ px: 2, py: '13px' }}
                   justifyContent="space-between" alignItems="center">
                <SectionHeader title="Schedule" subtitle={props.team.name} sx={{ mb: 0 }} />
                <Stack direction="row" divider={ <Divider orientation="vertical" flexItem /> }
                       spacing={2} alignItems="center">
                    <Tooltip title="Make available other teams' shifts">
                        <FormControlLabel control={ <Switch size="small"
                                                            defaultChecked={inclusiveShifts} /> }
                                          label={ <PeopleIcon fontSize="small" /> }
                                          labelPlacement="start"
                                          onChange={handleInclusiveShiftsChange}
                                          slotProps={{ typography: { sx: { display: 'flex',
                                                                           mr: .5 } } }} />
                    </Tooltip>
                    <ToggleButtonGroup exclusive value={date} size="small"
                                       onChange={handleDateChange} >
                        { availableDays.map(({ date, label }) =>
                            <ToggleButton key={date} value={date}>
                                {label}
                            </ToggleButton> )}
                    </ToggleButtonGroup>
                </Stack>
            </Stack>
            {props.children}
        </ScheduleContext.Provider>
    );
}
