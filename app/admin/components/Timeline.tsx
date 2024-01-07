// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { Eventcalendar, formatDate, type MbscEventcalendarView, type MbscResource } from '@mobiscroll/react';
import '@mobiscroll/react/dist/css/mobiscroll.min.css';
import './Timeline.css';

import Box from '@mui/material/Box';

import { dayjs } from '@lib/DateTime';
import type { MbscCalendarDayData } from '@mobiscroll/react/dist/src/core/shared/calendar-view/calendar-day';

/**
 * Props accepted by the <Timeline> component.
 */
export interface TimelineProps {
    /**
     * The period for which the timeline should be displayed. The user will not be able to scroll
     * outside of these boundaries.
     */
    period: {
        /**
         * Beginning of the period. Should be a full date & time representation in UTC.
         */
        start: string;

        /**
         * End of the period. Should be a full date & time representation in UTC.
         */
        end: string;
    },

    /**
     * Timezone in which dates and times on the timeline should be interpret.
     */
    timezone: string;
}

/**
 * The <Timeline> component wraps a third party library for managing timelines used for volunteering
 * schedules. It ensures a consistent interface within our project, and a consistent result towards
 * the volunteering leads who will be exposed to it.
 *
 * Right now we're experimenting with Mobiscroll as this library. This is a commercial package that
 * comes with a perpeptual usage license, so while we may not get upgrades it should remain usable
 * for the lifetime of the Volunteer Manager.
 *
 * @see https://mobiscroll.com/pricing
 * @see https://mobiscroll.com
 */
export function Timeline(props: TimelineProps) {
    const calendarData = [
        {

        }
    ];

    const min = dayjs(props.period.start).startOf('day');
    const max = dayjs(props.period.end).endOf('day');
    //const days = max.diff(min, 'days') + 1;

    const resources: MbscResource[] = [
        {
            id: 1,
            name: 'Peter',
        },
        {
            id: 2,
            name: 'Ferdi',
        },
        {
            id: 3,
            name: 'Neil',
        }
    ];

    const renderDay = (args: MbscCalendarDayData) => {
        return (
            <div className="timeline-day-header">
                {formatDate('DDDD', args.date)}
            </div>
        );
    };

    const renderHour = (args: MbscCalendarDayData) => {
        return (
            <div className="timeline-center-content">
                {formatDate('HH', args.date)}
            </div>
        );
    };

    const renderHourFooter = (args: MbscCalendarDayData) => {
        return (
            <div className="timeline-center-content">
                # { /* TODO: Calculate number of volunteers occupied at this time */ }
            </div>
        );
    };

    const calendarView: MbscEventcalendarView = {
        timeline: {
            type: 'day',
            size: 3,
            currentTimeIndicator: true,
        },
    };

    return (
        <Box sx={{ pb: 1 }}>
            <Eventcalendar dataTimezone="utc" displayTimezone={props.timezone} showControls={false}
                           refDate={min.toDate()} min={min.toDate()} max={max.toDate()}
                           resources={resources} view={calendarView} theme="material"
                           renderDay={renderDay}
                           renderHour={renderHour} renderHourFooter={renderHourFooter}
                           eventOverlap={false} dragToCreate dragToMove dragToResize eventDelete />
        </Box>
    );
}
