// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useFormContext } from '@components/proxy/react-hook-form-mui';

import { AutocompleteElement } from '@proxy/react-hook-form-mui';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { darken, lighten } from '@mui/system/colorManipulator';

import { ApplicationAvailabilityForm } from '@app/registration/[slug]/application/ApplicationParticipation';

/**
 * Custom styles applied to the <AvailabilityPreferences> & related components.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    sectionHeader: theme => {
        const getBackgroundColor = theme.palette.mode === 'light' ? lighten : darken;
        return {
            backgroundColor: getBackgroundColor(theme.palette.action.active, 0.9),
            borderRadius: theme.shape.borderRadius,
        };
    },
};

/**
 * Props accepted by the <AvailabilityPreferences> component.
 */
interface AvailabilityPreferencesProps {
    /**
     * Maximum number of events that the volunteer can request exemption from.
     */
    exceptionEventLimit: number;

    /**
     * Events that can be selected as the ones that the volunteer plans to attend.
     */
    exceptionEvents: { id: number; label: string }[];

    /**
     * Whether the form should be displayed in read-only mode.
     */
    readOnly?: boolean;
}

/**
 * The <AvailabilityPreferences> client-side component displays the volunteer's availability
 * preferences, together with the events they plan to attend and the availability exceptions that
 * have been applied to their participation.
 */
export function AvailabilityPreferences(props: AvailabilityPreferencesProps) {
    const { watch } = useFormContext();

    const fieldNames =
        [ ...Array(props.exceptionEventLimit) ].map((_, index) => `exceptionEvents[${index}]`);

    const values = watch(fieldNames);

    let numberOfEventsToAttend = 0;
    for (const value of values) {
        if (!!value)
            numberOfEventsToAttend++;
    }

    return (
        <>
            <ApplicationAvailabilityForm includeDietaryRestrictions readOnly={props.readOnly} />

            <Grid size={{ xs: 12 }}>
                <Accordion disableGutters elevation={0} square>
                    <AccordionSummary expandIcon={ <ExpandMoreIcon /> } sx={kStyles.sectionHeader}>
                        <Typography>
                            Events they plan to attend
                        </Typography>
                        <Typography sx={{ color: 'text.disabled', pl: 1 }}>
                            ({numberOfEventsToAttend})
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 2, pb: 0 }}>
                        <Grid container spacing={2}>
                            { [ ...Array(props.exceptionEventLimit) ].map((_, index) =>
                                <Grid key={index} size={{ xs: 12 }}>
                                    <AutocompleteElement name={`exceptionEvents[${index}]`}
                                                         autocompleteProps={{
                                                             fullWidth: true,
                                                             readOnly: props.readOnly,
                                                             size: 'small',
                                                         }}
                                                         label="Event…"
                                                         options={props.exceptionEvents} matchId />
                                </Grid> )}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Grid>

            { /* TODO: Exceptions */ }
        </>
    );
}
