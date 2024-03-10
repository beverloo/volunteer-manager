// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { FieldValues } from 'react-hook-form-mui';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { ShiftSettingsForm, type ShiftSettingsFormProps } from './ShiftSettingsForm';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <ShiftCreateSection> component.
 */
export interface ShiftCreateSectionProps extends Omit<ShiftSettingsFormProps, 'onSubmit'> {
    /**
     * Unique slug of the event for which a shift is being created.
     */
    event: string;

    /**
     * Unique slug of the team for which a shift is being created.
     */
    team: string;
}

/**
 * The <ShiftCreateSection> component manages the network interaction for creating a new shift,
 * while the underlying form is shared with the page that allows shifts to be changed.
 */
export function ShiftCreateSection(props: ShiftCreateSectionProps) {
    const { event, team, ...shiftSettingsFormProps } = props;

    const router = useRouter();
    const onSubmit = useCallback(async (data: FieldValues) => {
        const response = await callApi('post', '/api/admin/event/shifts', {
            context: { event, team },
            row: data,
        });

        if (!response.success)
            throw new Error(response.error ?? 'Unable to save the new shift in the database.');

        router.push(`/admin/events/${event}/${team}/shifts/${response.row.id}`);

    }, [ event, router, team ]);

    return <ShiftSettingsForm onSubmit={onSubmit} {...shiftSettingsFormProps} />;
}
