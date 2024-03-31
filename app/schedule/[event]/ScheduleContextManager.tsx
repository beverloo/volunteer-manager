// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';

import type { PublicSchedule } from '@app/api/event/schedule/getSchedule';
import { ScheduleContext } from './ScheduleContext';

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
    // Time offset, in seconds, to apply to the schedule's current time calculations.
    const [ offset, setOffset ] = useState<number | undefined>();

    // Load the schedule using SWR. The endpoint will be composed based on the props given to this
    // component, given to the manager by the server. Time offset is owned by the client.
    const endpoint = useMemo(() => {
        const endpointParams = new URLSearchParams;
        endpointParams.set('event', props.event);

        if (!!offset)
            endpointParams.set('offset', offset.toString());

        return `/api/event/schedule?${endpointParams.toString()}`;

    }, [ offset, props.event ]);

    const { data, error, isLoading } = useSWR<PublicSchedule>(endpoint, scheduleFetcher, {
        // TODO: Select the appropriate options
    });

    // TODO: Deal with `error`?
    // TODO: Deal with `isLoading`?

    return (
        <ScheduleContext.Provider value={data}>
            {props.children}
        </ScheduleContext.Provider>
    );
}
