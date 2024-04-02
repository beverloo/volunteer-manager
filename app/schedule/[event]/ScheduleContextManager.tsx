// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import type { PublicSchedule } from '@app/api/event/schedule/getSchedule';
import { ScheduleContext } from './ScheduleContext';
import { updateTimeConfig } from './CurrentTime';

/**
 * Fetcher used to retrieve the schedule from the server.
 */
const scheduleFetcher = (url: string) => fetch(url).then(r => r.json());

/**
 * Props accepted by the <ScheduleContextManager> component.
 */
export interface ScheduleContextManagerProps {
    /**
     * Unique slug of the event for which the context should be managed.
     */
    event: string;
}

/**
 * The <ScheduleContextManager> component powers the context used by the entire schedule app. It
 * periodically updates it, and makes sure that state is refreshed when connectivity state changes.
 */
export function ScheduleContextManager(props: React.PropsWithChildren<ScheduleContextManagerProps>)
{
    // Load the schedule using SWR. The endpoint will be composed based on the props given to this
    // component, given to the manager by the server.
    const endpoint = useMemo(() => {
        const endpointParams = new URLSearchParams;
        endpointParams.set('event', props.event);

        return `/api/event/schedule?${endpointParams.toString()}`;

    }, [ props.event ]);

    const { data, error, isLoading } = useSWR<PublicSchedule>(endpoint, scheduleFetcher, {
        // TODO: Select the appropriate options
    });

    // TODO: Deal with `error`?
    // TODO: Deal with `isLoading`?

    // Automatically update the Volunteer Manager's time offset and timezone configuration whenever
    // this is changed by the server. This immediately affects all instances where time is obtained.
    useEffect(() => {
        updateTimeConfig(data?.config.timeOffset, data?.config.timezone || 'utc');
    }, [ data?.config.timeOffset, data?.config.timezone ]);

    return (
        <ScheduleContext.Provider value={data}>
            {props.children}
        </ScheduleContext.Provider>
    );
}
