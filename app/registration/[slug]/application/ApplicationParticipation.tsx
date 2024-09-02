// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { SelectElement, TextFieldElement, TextareaAutosizeElement } from '@proxy/react-hook-form-mui';

import Grid, { type Grid2Props } from '@mui/material/Grid2';

import type { ApplicationDefinition } from '@app/api/event/application';
import { ShirtFit, ShirtSize } from '@lib/database/Types';

type ApplicationRequest = ApplicationDefinition['request'];

/**
 * Valid options for the number of hours volunteers are willing to work. When updating an ID, make
 * sure that `kDefaultValues` is updated as well.
 */
const kServiceHoursOptions: { id: ApplicationRequest['serviceHours'], label: string }[] = [
    { id: '12', label: 'Up to 12 hours' },
    { id: '16', label: '12–16 hours' },
    { id: '20', label: '16–20 hours' },
    { id: '24', label: 'More than 20 hours' },
];

/**
 * Valid options for the timing of shifts a volunteer could be issued. When updating an ID, make
 * sure that `kDefaultValues` is updated as well.
 */
const kServiceTimingOption: { id: ApplicationRequest['serviceTiming'], label: string }[] = [
    { id: '8-20', label: 'Early (08:00–20:00)' },
    { id: '10-0', label: 'Regular (10:00–00:00)' },
    { id: '14-3', label: 'Late (14:00–03:00)' },
];

/**
 * Valid options for the t-shirt fit select field.
 */
const kTShirtFitOptions: { id: ApplicationRequest['tshirtFit'], label: string }[] =
    Object.values(ShirtFit).map(fit => ({ id: fit, label: fit }));

/**
 * Valid options for the t-shirt size select field.
 */
const kTShirtSizeOptions: { id: ApplicationRequest['tshirtSize'], label: string }[] = [
    { id: ShirtSize.XS, label: 'XS' },
    { id: ShirtSize.S, label: 'Small' },
    { id: ShirtSize.M, label: 'Medium' },
    { id: ShirtSize.L, label: 'Large' },
    { id: ShirtSize.XL, label: 'XL' },
    { id: ShirtSize.XXL, label: 'XXL' },
    { id: ShirtSize['3XL'], label: '3XL' },
    { id: ShirtSize['4XL'], label: '4XL' },
];

/**
 * Props accepted by the <ApplicationAvailabilityForm> component.
 */
interface ApplicationAvailabilityFormProps {
    /**
     * Callback to be invoked when the value of one of the form fields has changed.
     */
    onChange?: () => void;

    /**
     * Whether the form should be locked, i.e. for all fields to be disabled.
     */
    readOnly?: boolean;
}

/**
 * The <ApplicationAvailabilityForm> component contains the necessary Grid rows to display a
 * volunteer's preferences in regards to the number of shifts they'll serve, the timing of those
 * shifts and further availability preferences they may have.
 */
export function ApplicationAvailabilityForm(props: ApplicationAvailabilityFormProps) {
    const { onChange, readOnly } = props;
    return (
        <>
            <Grid size={{ xs: 12, sm: 6 }}>
                <SelectElement name="serviceHours" label="Number of shifts" required
                               options={kServiceHoursOptions} fullWidth size="small"
                               onChange={onChange} disabled={readOnly} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <SelectElement name="serviceTiming" label="Timing of shifts" required
                               options={kServiceTimingOption} fullWidth size="small"
                               onChange={onChange} disabled={readOnly}  />
            </Grid>

            <Grid size={{ xs: 12 }}>
                <TextareaAutosizeElement name="preferences" fullWidth size="small"
                                         label="Anything we should know about?"
                                         onChange={onChange} disabled={readOnly} />
            </Grid>
        </>
    );
}

/**
 * Props accepted by the <ApplicationParticipationForm> component.
 */
interface ApplicationParticipationFormProps {
    /**
     * Whether the form should be in read-only mode.
     */
    readOnly?: boolean;

    /**
     * Callback to be invoked when the value of one of the form fields has changed.
     */
    onChange?: () => void;
}

/**
 * The <ApplicationParticipationForm> component contains the necessary information that has to be
 * filled in by a volunteer prior to their application to be submittable. This code is shared
 * between the registration front-end and the application management section for admins.
 */
export function ApplicationParticipationForm(props: ApplicationParticipationFormProps) {
    const { readOnly, onChange } = props;
    return (
        <>
            <Grid size={{ xs: 6 }}>
                <SelectElement name="tshirtSize" label="T-shirt size" required
                               options={kTShirtSizeOptions} fullWidth size="small"
                               disabled={readOnly} onChange={onChange} />
            </Grid>
            <Grid size={{ xs: 6 }}>
                <SelectElement name="tshirtFit" label="T-shirt fit" required
                               options={kTShirtFitOptions} fullWidth size="small"
                               disabled={readOnly} onChange={onChange} />
            </Grid>
        </>
    );
}
