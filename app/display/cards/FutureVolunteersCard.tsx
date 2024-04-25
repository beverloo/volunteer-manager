// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Unstable_Grid2';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import Paper from '@mui/material/Paper';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import Stack from '@mui/material/Stack';
import StarRateOutlinedIcon from '@mui/icons-material/StarRateOutlined';
import Typography from '@mui/material/Typography';

import type { DisplayShiftInfo } from '../DisplayContext';
import { Temporal, formatDate } from '@lib/Temporal';
import { VolunteersDialog } from './VolunteersDialog';

/**
 * Number of future groups to display on the card.
 */
const kFutureVolunteerGroupLimit = 2;

/**
 * Number of entries to display on the future volunteer list.
 */
const kFutureVolunteerEntryLimit = 9;

/**
 * Props accepted by the <FutureVolunteersCard> component.
 */
export interface FutureVolunteersCardProps {
    /**
     * Volunteers that will be helping out in this location.
     */
    schedule: {
        past: DisplayShiftInfo[];
        active: DisplayShiftInfo[];
        future: DisplayShiftInfo[];
    };

    /**
     * Timezone in which any times should be displayed in the user interface.
     */
    timezone: string;
}

/**
 * The <FutureVolunteersCard> component shows the volunteers who are expected to help out at this
 * location in the near future. Limited information will be shown.
 */
export function FutureVolunteersCard(props: FutureVolunteersCardProps) {
    const { schedule, timezone } = props;

    // ---------------------------------------------------------------------------------------------

    // Compose the `volunteers` in `kFutureGroupCount` groups based on the time at which their shift
    // will start. These will be displayed in the card, in order.
    const groups = useMemo(() => {
        const groups = new Map<number, DisplayShiftInfo[]>();

        let includedVolunteers = 0;
        for (const volunteer of schedule.future) {
            if (++includedVolunteers > kFutureVolunteerEntryLimit)
                break;  // the volunteer limit would be exceeded

            if (!groups.has(volunteer.start)) {
                if (groups.size === kFutureVolunteerGroupLimit)
                    break;  // the group limit would be exceeded

                groups.set(volunteer.start, [ /* empty */ ]);
            }

            groups.get(volunteer.start)!.push(volunteer);
        }

        return [ ...groups.entries() ].map(([ timestamp, volunteers ]) => ([
            Temporal.Instant.fromEpochSeconds(timestamp).toZonedDateTimeISO(timezone),
            volunteers,
        ]) as const);

    }, [ timezone, schedule ]);

    // ---------------------------------------------------------------------------------------------

    const [ dialogOpen, setDialogOpen ] = useState<boolean>(false);

    const handleDialogClose = useCallback(() => setDialogOpen(false), [ /* no dependencies */ ]);
    const handleDialogOpen = useCallback(() => setDialogOpen(true), [ /* no dependencies */ ]);

    return (
        <>
            <CardActionArea onClick={handleDialogOpen}>
                <Stack component={Paper} direction="column" spacing={2} sx={{ pt: 2 }}>
                    { groups.map(([ zonedDateTime, volunteers ]) =>
                        <Stack direction="row" key={zonedDateTime.epochSeconds} sx={{ px: 2 }}>
                            <Typography variant="body1" sx={{ pt: 1, width: '100px' }}>
                                { formatDate(zonedDateTime, 'HH:mm') }
                            </Typography>
                            <Grid container flexGrow={1} spacing={2}>
                                { volunteers.map(volunteer =>
                                    <Grid key={volunteer.id} xs={4}>
                                        <Paper variant="outlined"
                                            sx={{ p: 1, borderColor: 'transparent '}}>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body1">
                                                    {volunteer.name}
                                                </Typography>
                                                <Stack direction="row" alignItems="center"
                                                       spacing={1}>
                                                    { volunteer.team.includes('Host') &&
                                                        <LightbulbOutlinedIcon htmlColor="#455a64"
                                                                               fontSize="small" /> }
                                                    { volunteer.team.includes('Steward') &&
                                                        <SecurityOutlinedIcon htmlColor="#455a64"
                                                                              fontSize="small" /> }
                                                    { volunteer.role.includes('Senior') &&
                                                        <StarRateOutlinedIcon htmlColor="#ffeb3b"
                                                                              fontSize="small" /> }
                                                    { volunteer.role.includes('Staff') &&
                                                        <StarRateOutlinedIcon htmlColor="#ff5722"
                                                                              fontSize="small" /> }
                                                </Stack>
                                            </Stack>
                                        </Paper>
                                    </Grid> ) }
                            </Grid>
                        </Stack> ) }
                    <Box sx={{
                        backgroundColor: '#004e8b',
                        borderBottomLeftRadius: 4,
                        borderBottomRightRadius: 4,
                        height: '12px',
                        lineHeight: 0.6,
                        textAlign: 'center' }}>
                        …
                    </Box>
                </Stack>
            </CardActionArea>
            <VolunteersDialog onClose={handleDialogClose} open={dialogOpen} schedule={schedule}
                              timezone={timezone} />
        </>
    );
}
