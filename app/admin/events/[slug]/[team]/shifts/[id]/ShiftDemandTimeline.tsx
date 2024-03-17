// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import { Temporal } from '@lib/Temporal';
import { ShiftTimeline, type ShiftEntry, type ShiftGroup } from '@beverloo/volunteer-manager-timeline';
import '@beverloo/volunteer-manager-timeline/dist/volunteer-manager-timeline.css';

export type { ShiftEntry, ShiftGroup };

/**
 * Interface that defines the information associated with a group of information that is to be shown
 * on the timeline. This could be mutable shifts, but also immutable shifts or timeslot entries.
 */
export interface ShiftDemandTimelineGroup {
    /**
     * Entries that are associated with this group.
     */
    entries: ShiftEntry[];

    /**
     * Metadata describing what this group is about.
     */
    metadata: ShiftGroup;
}

/**
 * Props accepted by the <ShiftDemandTimeline> component.
 */
export interface ShiftDemandTimelineProps {
    /**
     * Called when any mutation has been made to the demand.
     */
    onChange?: (entries: ShiftEntry[]) => void;

    /**
     * Groups of information that should be shown on the timeline in an immutable fashion.
     */
    immutableGroups: ShiftDemandTimelineGroup[];

    /**
     * Whether demand from groups other than `mutableGroup` and the `timeline` group should be
     * removed from view. They should still be passed on to this component.
     */
    localGroupOnly?: boolean;

    /**
     * Group of information that should be shown on the timeline in a mutable fashion.
     */
    mutableGroup: ShiftGroup;

    /**
     * Entries that are associated with the mutable group.
     */
    mutableEntries: ShiftEntry[];

    /**
     * The minimum date and time to display on the timeline. Inclusive.
     */
    min: string;

    /**
     * The maximum date and time to display on the timeline. Exclusive.
     */
    max: string;

    /**
     * Whether the timeline should be shown in read-only mode, i.e. everything is immutable.
     */
    readOnly?: boolean;

    /**
     * Time step, in minutes, defining the granularity of events in the shift overview.
     */
    step?: number;

    /**
     * The timezone in which the timeline should be shown.
     */
    timezone: string;
}

/**
 * The <ShiftDemandTimeline> component implements the <ShiftTimeline> component provided by our
 * calendar library, with additional user interface expected by the Volunteer Manager.
 */
export function ShiftDemandTimeline(props: ShiftDemandTimelineProps) {
    const { min, max, readOnly, step, timezone } = props;

    // ---------------------------------------------------------------------------------------------

    const [ errorOpen, setErrorOpen ] = useState<boolean>(false);

    const handleErrorClose = useCallback(() => setErrorOpen(false), [ /* no deps */ ]);
    const handleError = useCallback((action: 'create' | 'update', reason: 'overlap') => {
        setErrorOpen(true);
    }, [ /* no deps */ ]);

    // ---------------------------------------------------------------------------------------------

    const groups: ShiftGroup[] = [ props.mutableGroup ];
    const immutableEntries: ShiftEntry[] = useMemo(() => {
        const immutableEntries: ShiftEntry[] = [];
        for (const group of props.immutableGroups) {
            if (!props.localGroupOnly && group.metadata.id !== 'timeslot')
                continue;  // ignore the group

            immutableEntries.push(...group.entries);
        }
        return immutableEntries;
    }, [ props.immutableGroups, props.localGroupOnly ]);

    for (const group of props.immutableGroups)
        groups.push(group.metadata);

    return (
        <>
            <ShiftTimeline temporal={Temporal} min={min} max={max} step={step} dataTimezone="utc"
                           displayTimezone={timezone} defaultGroup={props.mutableGroup.id}
                           groups={groups} readOnly={readOnly} mutableEntries={props.mutableEntries}
                           immutableEntries={immutableEntries} onChange={props.onChange}
                           onError={handleError} />
            <Snackbar autoHideDuration={3000} onClose={handleErrorClose} open={errorOpen}>
                <Alert severity="error" variant="filled" sx={{ width: '100%' }}>
                    Shifts for this team cannot overlap with each other
                </Alert>
            </Snackbar>
        </>
    );
}
