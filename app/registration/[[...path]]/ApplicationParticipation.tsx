// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { SelectElement, TextFieldElement } from 'react-hook-form-mui';

import Grid, { type Grid2Props } from '@mui/material/Unstable_Grid2';

import type { ApplicationDefinition } from '@app/api/event/application';

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
const kTShirtFitOptions: { id: ApplicationRequest['tshirtFit'], label: string }[] = [
    { id: 'Regular', label: 'Regular' },
    { id: 'Girly', label: 'Girly' },
];

/**
 * Valid options for the t-shirt size select field.
 */
const kTShirtSizeOptions: { id: ApplicationRequest['tshirtSize'], label: string }[] = [
    { id: 'XS', label: 'XS' },
    { id: 'S', label: 'Small' },
    { id: 'M', label: 'Medium' },
    { id: 'L', label: 'Large' },
    { id: 'XL', label: 'XL' },
    { id: 'XXL', label: 'XXL' },
    { id: '3XL', label: '3XL' },
    { id: '4XL', label: '4XL' },
];

/**
 * Props accepted by the <ApplicationParticipation> component.
 */
export interface ApplicationParticipationProps extends Omit<Grid2Props, 'container' | 'spacing'> {
    /* no self-owned props */
}

/**
 * The <ApplicationParticipation> component contains the necessary information that has to be filled
 * in by a volunteer prior to their application to be submittable. This code is shared between the
 * registration front-end and the application management section for admins.
 */
export function ApplicationParticipation(props: ApplicationParticipationProps) {
    return (
        <Grid container spacing={2} {...props}>
            <Grid xs={6}>
                <SelectElement name="tshirtSize" label="T-shirt size" required
                                options={kTShirtSizeOptions} fullWidth size="small" />
            </Grid>
            <Grid xs={6}>
                <SelectElement name="tshirtFit" label="T-shirt fit" required
                                options={kTShirtFitOptions} fullWidth size="small" />
            </Grid>

            <Grid xs={6}>
                <SelectElement name="serviceHours" label="Number of shifts" required
                                options={kServiceHoursOptions} fullWidth size="small" />
            </Grid>
            <Grid xs={6}>
                <SelectElement name="serviceTiming" label="Timing of shifts" required
                                options={kServiceTimingOption} fullWidth size="small" />
            </Grid>

            <Grid xs={12}>
                <TextFieldElement name="preferences" fullWidth size="small"
                                    label="Any preferences we should know about?" />
            </Grid>
        </Grid>
    );
}
