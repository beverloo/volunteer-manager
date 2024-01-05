// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import React, { useCallback, useState } from 'react';

import { type FieldValues, AutocompleteElement, CheckboxElement, FormContainer }
    from 'react-hook-form-mui';

import type { SxProps, Theme } from '@mui/system';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Table from '@mui/material/Table';
import Typography from '@mui/material/Typography';
import { darken, lighten } from '@mui/system';

import type { EventTimeslotEntry } from '@app/registration/[slug]/application/availability/getPublicEventsForFestival';
import type { PageInfoWithTeam } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { ApplicationAvailabilityForm } from '@app/registration/[slug]/application/ApplicationParticipation';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { callApi } from '@lib/callApi';
import { dayjs } from '@lib/DateTime';

/**
 * Custom styles applied to the <AdminHeader> & related components.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    section: {
        marginTop: 2,
        '&::before': {
            backgroundColor: 'transparent',
        }
    },
    sectionContent: {
        padding: theme => theme.spacing(2, 0, 0, 3),
    },
    sectionHeader: theme => {
        const getBackgroundColor = theme.palette.mode === 'light' ? lighten : darken;
        return {
            backgroundColor: getBackgroundColor(theme.palette.action.active, 0.9),
            borderRadius: theme.shape.borderRadius,
        };
    },
};

/**
 * Props accepted by the <AvailabilityExceptions> component.
 */
interface AvailabilityExceptionsProps {
    /**
     * Day and time on which the event will start.
     */
    eventStartTime: string;

    /**
     * Day and time on which the event will finish.
     */
    eventEndTime: string;

    /**
     * Callback to invoke whenever one of the settings has changed.
     */
    onChange: () => void;

    /**
     * Timezone in which the event will be taking place.
     */
    timezone: string;
}

/**
 * Component that renders an hour-by-hour grid allowing senior volunteers to adjust exceptions for
 * this volunteer. We only allow exceptions on the (full) days of the festival.
 */
function AvailabilityExceptions(props: AvailabilityExceptionsProps) {
    const firstEventDay = dayjs(props.eventStartTime).tz(props.timezone).startOf('day');
    const lastEventDay = dayjs(props.eventEndTime).tz(props.timezone).endOf('day');

    // Note: This is a hacky bare minimum implementation. We'll re-use the timeline component that
    // will also power shifts and scheduling once it exists.

    const days: React.JSX.Element[] = [];
    for (let date = firstEventDay; date.isBefore(lastEventDay); date = date.add(1, 'day')) {
        const dateKey = date.format('YYYY-MM-DD');;

        days.push(
            <TableRow key={dateKey}>
                <TableCell>{date.format('dddd')}</TableCell>
                { [ ...Array(24) ].map((_, index) =>
                    <TableCell align="center" key={index} padding="none"
                               sx={{ '& .MuiFormControlLabel-root': { margin: 0 } }}>
                        <CheckboxElement name={`exceptions[${dateKey}_${index}]`} size="small"
                                         sx={{ '& .MuiSvgIcon-root': { fontSize: 12 } }}
                                         onChange={props.onChange} />
                    </TableCell> )}
            </TableRow> );
    }

    return (
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell width="100">Day</TableCell>
                    { [ ...Array(24) ].map((_, index) =>
                        <TableCell align="center" key={index} padding="none">
                            {`0${index}`.substr(-2)}
                        </TableCell> )}
                </TableRow>
            </TableHead>
            <TableBody>
                {days}
            </TableBody>
        </Table>
    );
}

/**
 * Props accepted by the <ApplicationAvailability> component.
 */
export interface ApplicationAvailabilityProps {
    /**
     * Information about the event this volunteer will participate in.
     */
    event: PageInfoWithTeam['event'];

    /**
     * The list of public events that can be selected as wanting to attend.
     */
    events: EventTimeslotEntry[];

    /**
     * Slug of the team that this application is part of.
     */
    team: string;

    /**
     * Information about the volunteer for whom this page is being displayed.
     */
    volunteer: {
        userId: number;
        actualAvailableEventLimit: number;
        availabilityExceptions?: string;
        availabilityTimeslots?: string;
        preferences?: string;
        serviceHours?: number;
        preferenceTimingStart?: number;
        preferenceTimingEnd?: number;
    }
}

/**
 * The <ApplicationAvailability> component displays the volunteer's availability information and
 * allows the senior to modify it. All modifications will be logged.
 */
export function ApplicationAvailability(props: ApplicationAvailabilityProps) {
    const { event, team, volunteer } = props;

    const [ error, setError ] = useState<string>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        try {
            const eventPreferences: number[] = [];
            for (let index = 0; index < volunteer.actualAvailableEventLimit; ++index) {
                if (!Object.hasOwn(data, `preference_${index}`))
                    continue;  // no value has been set

                const timeslotId = data[`preference_${index}`];
                if (typeof timeslotId === 'number' && !Number.isNaN(timeslotId)) {
                    if (!eventPreferences.includes(timeslotId))
                        eventPreferences.push(timeslotId);
                }
            }

            const exceptions: { date: string; hour: number }[] = [];
            if (Object.hasOwn(data, 'exceptions') && typeof data.exceptions === 'object') {
                for (const [ key, value ] of Object.entries(data.exceptions)) {
                    if (!value || !key.includes('_'))
                        continue;

                    const [ date, hour ] = key.split('_', 2);
                    exceptions.push({
                        date,
                        hour: parseInt(hour, 10),
                    });
                }
            }

            const response = await callApi('post', '/api/event/availability-preferences', {
                environment: team,
                event: event.slug,
                eventPreferences: eventPreferences,
                exceptions,
                preferences: data.preferences,
                serviceHours: `${data.serviceHours}` as any,
                serviceTiming: data.serviceTiming,
                adminOverrideUserId: volunteer.userId,
            });

            if (response.success)
                setInvalidated(false);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ event.slug, team, volunteer.actualAvailableEventLimit, volunteer.userId ]);

    const serviceTiming = `${volunteer.preferenceTimingStart}-${volunteer.preferenceTimingEnd}`;
    const defaultValues: Record<string, any> = {
        ...volunteer,
        serviceTiming
    };

    let numberOfEventsToAttend = 0;
    if (volunteer.availabilityTimeslots && volunteer.availabilityTimeslots.length > 2) {
        volunteer.availabilityTimeslots.split(',').map((timeslotId, index) => {
            defaultValues[`preference_${index}`] = parseInt(timeslotId, 10);
            numberOfEventsToAttend++;
        });
    }

    let numberOfExceptions = 0;
    if (volunteer.availabilityExceptions && volunteer.availabilityExceptions.length > 2) {
        const exceptions = JSON.parse(volunteer.availabilityExceptions);
        if (Array.isArray(exceptions)) {
            numberOfExceptions = exceptions.length;
            for (let index = 0; index < exceptions.length; ++index) {
                if (!('date' in exceptions[index]) || !('hour' in exceptions[index]))
                    continue;

                const { date, hour } = exceptions[index];
                defaultValues[`exceptions[${date}_${hour}]`] = true;
            }
        }
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 2 }}>
                Availability preferences
            </Typography>
            <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
                <Grid container spacing={2}>
                    <ApplicationAvailabilityForm onChange={handleChange} />
                </Grid>
                <Accordion disableGutters elevation={0} square sx={kStyles.section}>
                    <AccordionSummary expandIcon={ <ExpandMoreIcon /> } sx={kStyles.sectionHeader}>
                        Events they plan to attend
                        <Typography sx={{ color: 'text.disabled', pl: 1 }}>
                            ({numberOfEventsToAttend})
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={kStyles.sectionContent}>
                        <Grid container spacing={2}>
                            { [ ...Array(volunteer.actualAvailableEventLimit) ].map((_, index) =>
                                <Grid key={index} xs={12}>
                                    <AutocompleteElement name={`preference_${index}`}
                                                         autocompleteProps={{
                                                             fullWidth: true,
                                                             onChange: handleChange,
                                                             size: 'small',
                                                         }}
                                                         options={props.events} matchId />
                                </Grid> )}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
                <Accordion disableGutters elevation={0} square sx={kStyles.section}>
                    <AccordionSummary expandIcon={ <ExpandMoreIcon /> } sx={kStyles.sectionHeader}>
                        Unavailability exceptions
                        <Typography sx={{ color: 'text.disabled', pl: 1 }}>
                            ({numberOfExceptions})
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={kStyles.sectionContent}>
                        <AvailabilityExceptions eventStartTime={event.startTime}
                                                eventEndTime={event.endTime} onChange={handleChange}
                                                timezone={event.timezone} />
                    </AccordionDetails>
                </Accordion>
                <SubmitCollapse error={error} open={invalidated} loading={loading} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}
