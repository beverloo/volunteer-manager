// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { DateTimePickerElement } from 'react-hook-form-mui/date-pickers';
import { TextFieldElement } from '@proxy/react-hook-form-mui';

import Grid from '@mui/material/Grid2';

/**
 * Props accepted by the <EventSettingsForm> component.
 */
interface EventSettingsFormProps {
    /**
     * Whether the event slug should be mutable.
     */
    mutableSlug?: boolean;

    /**
     * The change event that should be invoked every time a field is invalidated.
     */
    onChange?: () => void;
}

/**
 * The <EventSettingsForm> component encapsulates the required settings for
 */
export function EventSettingsForm(props: EventSettingsFormProps) {
    const { mutableSlug, onChange } = props;

    return (
        <>
            <Grid size={{ xs: 12 }}>
                <TextFieldElement name="name" label="Full event name" required fullWidth
                                  size="small" onChange={onChange} />
            </Grid>

            <Grid size={{ xs: 6 }}>
                <TextFieldElement name="shortName" label="Short event name" required
                                  fullWidth size="small" onChange={onChange} />
            </Grid>
            <Grid size={{ xs: 6 }}>
                <TextFieldElement name="slug" label="Event slug" required fullWidth
                                  size="small" InputProps={{ readOnly: !mutableSlug }}
                                  onChange={onChange} />
            </Grid>

            <Grid size={{ xs: 6 }}>
                <DateTimePickerElement name="startTime" label="Start time" required
                                       inputProps={{ fullWidth: true, size: 'small' }}
                                       onChange={onChange} textReadOnly />
            </Grid>
            <Grid size={{ xs: 6 }}>
                <DateTimePickerElement name="endTime" label="End time" required
                                       inputProps={{ fullWidth: true, size: 'small' }}
                                       onChange={onChange} textReadOnly />
            </Grid>
        </>
    );
}
