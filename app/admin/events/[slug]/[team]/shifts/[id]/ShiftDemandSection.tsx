// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { FormContainer } from 'react-hook-form-mui';
import { useCallback, useState } from 'react';

import Box from '@mui/material/Box';

import type { PageInfoWithTeam } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { ShiftDemandTimelineGroup, ShiftEntry, ShiftGroup } from './ShiftDemandTimeline';
import { ShiftDemandTimeline } from './ShiftDemandTimeline';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { Temporal } from '@lib/Temporal';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <ShiftDemandSection> component.
 */
export interface ShiftDemandSectionProps {
    /**
     * Information about the event for which the demand section is being shown.
     */
    event: PageInfoWithTeam['event'];

    /**
     * Groups of information that should be shown on the timeline in an immutable fashion.
     */
    immutableGroups: ShiftDemandTimelineGroup[];

    /**
     * Group of information that should be shown on the timeline in a mutable fashion.
     */
    mutableGroup: ShiftGroup;

    /**
     * Entries that are associated with the mutable group.
     */
    mutableEntries: ShiftEntry[];

    /**
     * Whether the demand section should be shown in read-only mode.
     */
    readOnly?: boolean;

    /**
     * Unique ID of the shift this section is being shown for, as it exists in the database.
     */
    shiftId: number;

    /**
     * Time step, in minutes, defining the granularity of events in the shift overview.
     */
    step?: number;

    /**
     * Information about the team for whom demand is being shown.
     */
    team: PageInfoWithTeam['team'];
}

/**
 * The <ShiftDemandSection> component contains an overview of the requested demand for this
 * particular shift. It flags any associated timeslots on the program, as well as shifts that the
 * other teams involved in this festival may have scheduled.
 */
export function ShiftDemandSection(props: ShiftDemandSectionProps) {
    const { immutableGroups, mutableGroup, event, readOnly, step, team } = props;

    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const [ entries, setEntries ] = useState<ShiftEntry[]>(props.mutableEntries);

    // ---------------------------------------------------------------------------------------------
    // Section: Management of the demand table
    // ---------------------------------------------------------------------------------------------

    const handleChange = useCallback((entries: ShiftEntry[]) => {
        setEntries(entries);
        setInvalidated(true);
    }, [ /* no dependencies */ ]);

    const handleSubmit = useCallback(async () => {
        setError(undefined);
        setLoading(true);
        try {
            const normalisedEntries = [];
            for (const entry of entries) {
                if (!Object.hasOwn(entry, 'start') || !Object.hasOwn(entry, 'end'))
                    continue;  // invalid entry due to the calendar library
                if (!Object.hasOwn(entry, 'volunteers') || typeof entry.volunteers !== 'number')
                    continue;  // invalid entry due to our own fault

                normalisedEntries.push({
                    start: entry.start,
                    end: entry.end,
                    volunteers: entry.volunteers,
                });
            }

            const result = await callApi('put', '/api/admin/event/shifts/:id', {
                context: {
                    event: event.slug,
                    team: team.slug,
                },
                id: props.shiftId,
                row: {
                    id: props.shiftId,
                    demand: JSON.stringify(normalisedEntries),

                    colour: '',  // ignored
                    category: '',  // ignored
                    categoryOrder: 0,  // ignored
                    excitement: 0,  // ignored
                },
            });

            if (!!result.success)
                setInvalidated(false);
            else
                setError(result.error ?? 'Unable to update demand in the database.');

        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ entries, event, props.shiftId, team ]);

    // ---------------------------------------------------------------------------------------------

    const min = Temporal.ZonedDateTime.from(event.startTime)
        .withTimeZone(event.timezone).with({ hour: 6, minute: 0, second: 0 })
            .toString({ timeZoneName: 'never' });

    const max = Temporal.ZonedDateTime.from(event.endTime)
        .withTimeZone(event.timezone).with({ hour: 22, minute: 0, second: 0 })
            .toString({ timeZoneName: 'never' });

    return (
        <FormContainer onSuccess={handleSubmit}>
            <Box>
                <ShiftDemandTimeline min={min} max={max} readOnly={readOnly} step={step}
                                     timezone={event.timezone} immutableGroups={immutableGroups}
                                     mutableGroup={mutableGroup} mutableEntries={entries}
                                     onChange={handleChange} />
            </Box>
            <SubmitCollapse error={error} open={invalidated} loading={loading} sx={{ mt: 2 }} />
        </FormContainer>
    );
}
