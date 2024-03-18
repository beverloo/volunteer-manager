// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback } from 'react';

import type { FieldValues } from 'react-hook-form-mui';
import Stack from '@mui/material/Stack';

import type { EventShiftContext, EventShiftRowModel } from '@app/api/admin/event/shifts/[[...id]]/route';
import { ShiftSettingsForm } from '../ShiftSettingsForm';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <ShiftSettingsSection> component.
 */
export interface ShiftSettingsSectionProps extends EventShiftContext {
    /**
     * The activities that can be selected when creating this shift.
     */
    activities: { id: number; label: string }[];

    /**
     * The categories of shifts that can be selected when creating a new one.
     */
    categories: { id: number; label: string }[];

    /**
     * The locations within which shifts of our own initiative can be located.
     */
    locations: { id: number; label: string }[];

    /**
     * Whether the form should be in read-only mode.
     */
    readOnly?: boolean;

    /**
     * Default values that should be applied to the form, if any.
     */
    shift: EventShiftRowModel;
}

/**
 * The <ShiftSettingsSection> component enables a lead (w/ sufficient access) to change the settings
 * associated with a particular shift. This influences how it will appear in the interface, and
 * eventually to volunteers.
 */
export function ShiftSettingsSection(props: ShiftSettingsSectionProps) {
    const handleSubmit = useCallback(async (data: FieldValues) => {
        const response = await callApi('put', '/api/admin/event/shifts/:id', {
            context: props.context,
            id: props.shift.id,
            row: {
                id: props.shift.id,
                name: data.name,
                activityId: data.activityId,
                categoryId: data.categoryId,
                locationId: data.locationId,
                excitement: 0,

                colour: '',  // ignored
                category: '',  // ignored
                categoryOrder: 0,  // ignored
            },
        });

        if (!response.success)
            throw new Error(response.error ?? 'The shift could not be updated in the database.');

    }, [ props.context, props.shift ]);

    return (
        <>
            <ShiftSettingsForm includeName onSubmit={handleSubmit} {...props}>
                <Stack direction="column" spacing={2}>
                    { /* TODO: Shift excitement */ }
                    { /* TODO: Shift expected overlap */ }
                    { /* TODO: Shift description */ }
                </Stack>
            </ShiftSettingsForm>
        </>
    );
}
