// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { useMemo } from 'react';

import { default as MuiLink } from '@mui/material/Link';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Table from '@mui/material/Table';
import Typography from '@mui/material/Typography';

import { dayjs } from '@lib/DateTime';

/**
 * Information about an individual confirmation.
 */
export interface TrainingConfirmation {
    /**
     * Maximum number of people who can participate in this session.
     */
    capacity: number;

    /**
     * Date on which the session will be taking place.
     */
    date: Date;

    /**
     * Participants in this session. May be empty.
     */
    participants: {
        /**
         * Full name of the participant.
         */
        name: string;

        /**
         * User ID and team of the participant, when they are a volunteer.
         */
        userId?: number;
        team?: string;

        /**
         * Whether their participation is fully confirmed.
         */
        confirmed: boolean;
    }[];
}

/**
 * Props accepted by the <TrainingOverview> component.
 */
export interface TrainingOverviewProps {
    /**
     * Confirmed participation in trainings that can be shown in a tabular view.
     */
    confirmations: TrainingConfirmation[];
}

/**
 * The <TrainingOverview> component, only shown when there are confirmed trainings, displays the
 * final overview tables of who participates in which trainings.
 */
export function TrainingOverview(props: TrainingOverviewProps) {
    const [ totalCount, rows ] = useMemo(() => {
        let totalCount = 0;
        const rows = [];

        for (let index = 0;; ++index) {
            const row = [];

            let count = 0;
            for (const session of props.confirmations) {
                if (session.participants.length > index) {
                    totalCount++;
                    count++;
                }

                row.push({
                    overflow: index >= session.capacity,
                    ...session.participants[index],
                });
            }

            if (!count)
                break;

            rows.push(row);
        }

        return [ totalCount, rows ];

    }, [ props.confirmations ]);

    return (
        <Accordion disableGutters sx={{ mt: 2, '& >:first-child': { mt: 2 } }}>
            <AccordionSummary expandIcon={ <ExpandMoreIcon /> }>
                <Typography variant="h5">
                    Confirmed participation
                    <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                        ({totalCount})
                    </Typography>
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Table size="small" sx={{ marginTop: '-8px' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell width="50"></TableCell>
                            { props.confirmations.map((session, index) =>
                                <TableCell key={index} align="center">
                                    { dayjs(session.date).format('dddd, MMMM D') }
                                </TableCell> )}
                            <TableCell width="50"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        { rows.map((row, index) =>
                            <TableRow key={index}>
                                <TableCell sx={{ color: 'text.disabled' }} align="left">
                                    {index + 1}
                                </TableCell>
                                { row.map((participant, index2) => {
                                    if (!participant)
                                        return <TableCell key={index2}></TableCell>;

                                    const href =
                                        `./${participant.team}/volunteers/${participant.userId}`;

                                    let color: string | undefined = undefined;
                                    if (participant.overflow)
                                        color = 'warning.main';
                                    else if (!participant.confirmed)
                                        color = 'text.disabled';

                                    return (
                                        <TableCell key={index2} align="center">
                                            <Typography variant="body2" sx={{
                                                fontStyle: participant.confirmed ? '' : 'italic',
                                                '& a': { color } }}>

                                                { !participant.userId && participant.name }
                                                { !!participant.userId &&
                                                    <MuiLink component={Link} href={href}>
                                                        {participant.name}
                                                    </MuiLink> }

                                            </Typography>
                                        </TableCell>
                                    );
                                } )}
                                <TableCell sx={{ color: 'text.disabled' }} align="right">
                                    {index + 1}
                                </TableCell>
                            </TableRow> )}
                    </TableBody>
                </Table>
            </AccordionDetails>
        </Accordion>
    );
}
