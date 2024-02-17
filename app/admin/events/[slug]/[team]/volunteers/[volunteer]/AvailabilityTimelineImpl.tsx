// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { SelectElement } from 'react-hook-form-mui';
import { useCallback, useState } from 'react';

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import type { AvailabilityTimeslot } from '@beverloo/volunteer-manager-timeline';
import { AvailabilityTimeline } from '@beverloo/volunteer-manager-timeline';
import { SettingDialog } from '@app/admin/components/SettingDialog';
import { Temporal } from '@lib/Temporal';

import '@beverloo/volunteer-manager-timeline/dist/volunteer-manager-timeline.css';

/**
 * Promise resolver function used with the ability to modify timeslots.
 */
type PromiseResolver = (value?: AvailabilityTimeslot) => void;

/**
 * Options that can be chosen in the availability exception configuration dialog.
 */
const kExceptionTypeOptions = [
    { id: 'available', label: 'Available for shifts' },
    { id: 'avoid', label: 'Avoid shifts' },
    { id: 'unavailable', label: 'Unavailable for shifts' },
];

/**
 * Props accepted by the <AvailabilityTimelineImpl> component.
 */
export interface AvailabilityTimelineImplProps {
    /**
     * The minimum date and time to display on the calendar. Inclusive.
     */
    min: string;

    /**
     * The maximum date and time to display on the calendar. Exclusive.
     */
    max: string;

    /**
     * Called when any mutation has been made to the availability timeline, which includes created
     * events, updated events and deleted events.
     */
    onChange?: (timeslots: AvailabilityTimeslot[]) => void;

    /**
     * Whether the timeline should be displayed in read only mode, which means that no modifications
     * can be made to content on the timeline at all. Defaults to _off_.
     */
    readOnly?: boolean;

    /**
     * Whether the component should be in dark or light mode. Defaults to `light`.
     */
    theme?: 'dark' | 'light';

    /**
     * The timeslots that should be displayed on the timeline. Timeslots should not overlap with
     * each other, as availability state is mutually exclusive information.
     */
    timeslots: AvailabilityTimeslot[];

    /**
     * The timezone in which the data should be displayed. Input data is assumed to be UTC.
     */
    timezone: string;
}

/**
 * The <AvailabilityTimelineImpl> component is the implementation of the <AvailabilityTimeline>
 * specific to the AnimeCon Volunteer Manager, integrated with MUI.
 */
export function AvailabilityTimelineImpl(props: AvailabilityTimelineImplProps) {
    const { min, max, onChange, readOnly, theme, timeslots, timezone } = props;

    // ---------------------------------------------------------------------------------------------

    const [ errorOpen, setErrorOpen ] = useState<boolean>(false);

    const handleErrorClose = useCallback(() => setErrorOpen(false), [ /* no deps */ ]);
    const handleError = useCallback((action: 'create' | 'update', reason: 'overlap') => {
        setErrorOpen(true);
    }, [ /* no deps */ ]);

    // ---------------------------------------------------------------------------------------------

    const [ selectedTimeslot, setSelectedTimeslot ] = useState<AvailabilityTimeslot | undefined>();
    const [ selectedResolver, setSelectedResolver ] = useState<PromiseResolver | undefined>();

    const handleSettings = useCallback(async (timeslot: AvailabilityTimeslot) => {
        return new Promise<AvailabilityTimeslot | undefined>(resolve => {
            setSelectedTimeslot(timeslot);
            setSelectedResolver(() => resolve);
        });
    }, [ /* no deps */ ]);

    const handleSettingsClose =
        useCallback(() => setSelectedTimeslot(undefined), [ /* no deps */ ]);

    const handleSettingsDelete = useCallback(async () => {
        if (!selectedTimeslot || !selectedResolver)
            return { error: <>I forgot which timeslot was selected, sorry!</> };

        selectedResolver(/* delete= */ undefined);
        return { close: true } as const;

    }, [ selectedResolver, selectedTimeslot ]);

    const handleSettingsUpdate = useCallback(async (data: any) => {
        if (!selectedTimeslot || !selectedResolver)
            return { error: <>I forgot which timeslot was selected, sorry!</> };

        if (![ 'unavailable', 'avoid', 'available' ].includes(data.state))
            return { error: <>I don't know which state to update to, sorry!</> };

        selectedResolver({ ...selectedTimeslot, state: data.state });
        return { close: true } as const;

    }, [ selectedResolver, selectedTimeslot ]);

    // ---------------------------------------------------------------------------------------------

    return (
        <>
            <AvailabilityTimeline temporal={Temporal} min={min} max={max}
                                  dataTimezone="utc" displayTimezone={timezone} theme={theme}
                                  onChange={onChange} onDoubleClick={handleSettings}
                                  onError={handleError} readOnly={readOnly} timeslots={timeslots} />
            <SettingDialog title="Availability exception" delete open={!!selectedTimeslot}
                           onClose={handleSettingsClose} onDelete={handleSettingsDelete}
                           onSubmit={handleSettingsUpdate} defaultValues={ selectedTimeslot ?? {} }>
                <SelectElement name="state" size="small" fullWidth sx={{ mt: '1px' }}
                               options={kExceptionTypeOptions} />
            </SettingDialog>
            <Snackbar autoHideDuration={3000} onClose={handleErrorClose} open={errorOpen}>
                <Alert severity="error" variant="filled" sx={{ width: '100%' }}>
                    Exceptions cannot overlap with each other
                </Alert>
            </Snackbar>
        </>
    );
}
