// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { DateTimePickerElement, TextFieldElement } from 'react-hook-form-mui';

import type { InputProps } from '@mui/material/Input';
import Grid from '@mui/material/Unstable_Grid2';

/**
 * Props accepted by the <EventSettingsForm> component.
 */
export interface EventSettingsFormProps {
    /**
     * Whether the event slug should be mutable.
     */
    mutableSlug?: boolean;

    /**
     * The change event that should be invoked every time a field is invalidated.
     */
    onChange?: InputProps['onChange'];
}

/**
 * The <EventSettingsForm> component encapsulates the required settings for
 */
export function EventSettingsForm(props: EventSettingsFormProps) {
    const { mutableSlug, onChange } = props;

    return (
        <Grid container spacing={2}>
            <Grid xs={12}>
                <TextFieldElement name="name" label="Full event name" required fullWidth
                                  size="small" onChange={onChange} />
            </Grid>

            <Grid xs={6}>
                <TextFieldElement name="shortName" label="Short event name" required
                                  fullWidth size="small" onChange={onChange} />
            </Grid>
            <Grid xs={6}>
                <TextFieldElement name="slug" label="Event slug" required fullWidth
                                  size="small" InputProps={{ readOnly: !mutableSlug }}
                                  onChange={onChange} />
            </Grid>

            <Grid xs={6}>
                <DateTimePickerElement name="startTime" label="Start time" required
                                       inputProps={{ fullWidth: true, size: 'small' }}
                                       onChange={onChange} textReadOnly />
            </Grid>
            <Grid xs={6}>
                <DateTimePickerElement name="endTime" label="End time" required
                                       inputProps={{ fullWidth: true, size: 'small' }}
                                       onChange={onChange} textReadOnly />
            </Grid>
        </Grid>
    );
}
