// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { z } from 'zod/v4';
import { useCallback, useState } from 'react';

import { SelectElement, TextareaAutosizeElement, useFormContext } from '@proxy/react-hook-form-mui';

import Collapse from '@mui/material/Collapse';
import DomainAddIcon from '@mui/icons-material/DomainAdd';
import DomainDisabledIcon from '@mui/icons-material/DomainDisabled';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';

import { kServiceHoursProperty, kServiceTimingProperty } from './ApplicationActions';
import { kShirtFit, kShirtSize, type ShirtFit, type ShirtSize } from '@lib/database/Types';

type ServiceHourValues = z.TypeOf<typeof kServiceHoursProperty>;
type ServiceTimingValues = z.TypeOf<typeof kServiceTimingProperty>;

/**
 * Valid options for when the volunteer will start helping with the Thursday build-up.
 */
const kBuildUpOptions: { id: string, label: string }[] = [
    { id: '10:00–12:00', label: 'Thursday from at 10:00-12:00' },
    { id: '12:00–14:00', label: 'Thursday from at 12:00-14:00' },
    { id: '14:00–16:00', label: 'Thursday from at 14:00-16:00' },
    { id: '16:00–18:00', label: 'Thursday from at 16:00-18:00' },
    { id: '18:00–00:00', label: 'Thursday after 18:00' },
];

/**
 * Valid options for when the volunteer will start helping with the Friday and Monday tear-down.
 */
const kTearDownOptions: { id: string, label: string }[] = [
    { id: '20:00', label: 'Friday evening until 20:00' },
    { id: '22:00', label: 'Friday evening until 22:00' },
    { id: '00:00', label: 'Friday evening until 00:00' },
    { id: '00:00 and Monday (until noon)', label: 'Friday evening and Monday until 12:00' },
    { id: '00:00 and Monday', label: 'Friday evening and all day Monday' },
];

/**
 * Valid options for the number of hours volunteers are willing to work. When updating an ID, make
 * sure that `kDefaultValues` is updated as well.
 */
const kServiceHoursOptions: { id: ServiceHourValues, label: string }[] = [
    { id: '12', label: 'Up to 12 hours' },
    { id: '16', label: '12–16 hours' },
    { id: '20', label: '16–20 hours' },
    { id: '24', label: 'More than 20 hours' },
];

/**
 * Valid options for the timing of shifts a volunteer could be issued. When updating an ID, make
 * sure that `kDefaultValues` is updated as well.
 */
const kServiceTimingOption: { id: ServiceTimingValues, label: string }[] = [
    { id: '8-20', label: 'Early (08:00–20:00)' },
    { id: '10-0', label: 'Regular (10:00–00:00)' },
    { id: '14-3', label: 'Late (14:00–03:00)' },
];

/**
 * Valid options for the t-shirt fit select field.
 */
const kTShirtFitOptions: { id: ShirtFit, label: string }[] =
    Object.values(kShirtFit).map(fit => ({ id: fit, label: fit }));

/**
 * Valid options for the t-shirt size select field.
 */
const kTShirtSizeOptions: { id: ShirtSize, label: string }[] = [
    { id: kShirtSize.XS, label: 'XS' },
    { id: kShirtSize.S, label: 'Small' },
    { id: kShirtSize.M, label: 'Medium' },
    { id: kShirtSize.L, label: 'Large' },
    { id: kShirtSize.XL, label: 'XL' },
    { id: kShirtSize.XXL, label: 'XXL' },
    { id: kShirtSize['3XL'], label: '3XL' },
    { id: kShirtSize['4XL'], label: '4XL' },
];

/**
 * Props accepted by the <ApplicationAvailabilityForm> component.
 */
interface ApplicationAvailabilityFormProps {
    /**
     * Whether the option should be available where a volunteer can indicate that they're helping
     * out during the festival's build-up.
     */
    includeBuildUp?: boolean;

    /**
     * Whether the dietary restrictions field should be included. Omitted from the registration form
     * as we want to minimsie the number of fields there.
     */
    includeDietaryRestrictions?: boolean;

    /**
     * Whether the option should be available where a volunteer can indicate that they're helping
     * out during the festival's tear-down.
     */
    includeTearDown?: boolean;

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
    const { readOnly } = props;
    return (
        <>
            <Grid size={{ xs: 12, sm: 6 }}>
                <SelectElement name="serviceHours" label="Number of shifts" required
                               options={kServiceHoursOptions} fullWidth size="small"
                               disabled={readOnly} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <SelectElement name="serviceTiming" label="Timing of shifts" required
                               options={kServiceTimingOption} fullWidth size="small"
                               disabled={readOnly}  />
            </Grid>
            { !!props.includeDietaryRestrictions &&
                <Grid size={{ xs: 12 }}>
                    <TextareaAutosizeElement name="preferencesDietary" fullWidth size="small"
                                             label="Any dietary restrictions?"
                                             disabled={readOnly} />
                </Grid> }
            <Grid size={{ xs: 12 }}>
                <TextareaAutosizeElement name="preferences" fullWidth size="small"
                                         label="Anything we should know about?"
                                         disabled={readOnly} />
            </Grid>
            { !!props.includeBuildUp &&
                <Grid size={{ xs: 12, md: 6 }}>
                    <AvailabilityBuildUpTearDownField name="availabilityBuildUp"
                                                      variant="build-up" />
                </Grid> }
            { !!props.includeTearDown &&
                <Grid size={{ xs: 12, md: 6 }}>
                    <AvailabilityBuildUpTearDownField name="availabilityTearDown"
                                                      variant="tear-down" />
                </Grid> }
        </>
    );
}

/**
 * Props accepted by the <AvailabilityBuildUpTearDownField> component.
 */
interface AvailabilityBuildUpTearDownFieldProps {
    /**
     * Name of the field that this element wraps.
     */
    name: string;

    /**
     * Variant of the field that should be shown.
     */
    variant: 'build-up' | 'tear-down';
}

/**
 * The <AvailabilityBuildUpTearDownField> component is the rich build-up or tear-down element using
 * which volunteers can indicate whether they plan to help out with either.
 */
function AvailabilityBuildUpTearDownField(props: AvailabilityBuildUpTearDownFieldProps) {
    const { setValue, watch } = useFormContext();

    const value = watch(props.name);

    // ---------------------------------------------------------------------------------------------

    const [ timeSelectionOpen, setTimeSelectionOpen ] = useState<boolean>(!!value);
    const toggleTimeSelection = useCallback(() => {
        if (!!timeSelectionOpen && !!value)
            setValue(props.name, /* reset= */ '');

        setTimeSelectionOpen(!timeSelectionOpen);

    }, [ props.name, setValue, timeSelectionOpen, value ]);

    // ---------------------------------------------------------------------------------------------

    const icon = props.variant === 'build-up'
        ? <DomainAddIcon color={ !!value ? 'success' : undefined } />
        : <DomainDisabledIcon color={ !!value ? 'success' : undefined } />;

    const label = props.variant === 'build-up' ? 'build up' : 'tear down';
    const options = props.variant === 'build-up' ? kBuildUpOptions : kTearDownOptions;

    return (
        <Stack direction="column">
            <ToggleButton value="check" size="small" fullWidth onClick={toggleTimeSelection}>
                <Stack direction="row" spacing={2}>
                    {icon}
                    <Typography variant="button" color={ !!value ? 'success' : undefined }>
                        { !!value ? 'Yes, I will' : 'No, I won\'t' } help out with {label}
                    </Typography>
                </Stack>
            </ToggleButton>
            <Collapse in={timeSelectionOpen}>
                <Stack direction="row" alignItems="center" sx={{
                    borderBottomLeftRadius: 4,
                    borderBottomRightRadius: 4,
                    backgroundColor: theme =>
                        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.045)'
                                                      : 'rgba(0, 0, 0, 0.035)',
                    padding: 1,
                }}>
                    <SubdirectoryArrowRightIcon sx={{ mr: 1 }} />
                    <SelectElement name={props.name} fullWidth size="small"
                                   label="When will you help out?" options={options}
                                   sx={{ mt: 0.5 }} />
                </Stack>
            </Collapse>
        </Stack>
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
}

/**
 * The <ApplicationParticipationForm> component contains the necessary information that has to be
 * filled in by a volunteer prior to their application to be submittable. This code is shared
 * between the registration front-end and the application management section for admins.
 */
export function ApplicationParticipationForm(props: ApplicationParticipationFormProps) {
    const { readOnly } = props;

    return (
        <>
            <Grid size={{ xs: 6 }}>
                <SelectElement name="tshirtSize" label="T-shirt size" required
                               options={kTShirtSizeOptions} fullWidth size="small"
                               slotProps={{ input: { readOnly } }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
                <SelectElement name="tshirtFit" label="T-shirt fit" required
                               options={kTShirtFitOptions} fullWidth size="small"
                               slotProps={{ input: { readOnly } }} />
            </Grid>
        </>
    );
}
