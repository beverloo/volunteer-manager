// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Table from '@mui/material/Table';
import Typography from '@mui/material/Typography';

import type { TrainingsDataExport } from '@app/api/exports/route';
import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <ExportTrainings> component.
 */
export interface ExportTrainingsProps {
    /**
     * The training data export that should be rendered by this component.
     */
    trainings: TrainingsDataExport;
}

/**
 * The <ExportTrainings> component displays participation information in the Steward Trainings that
 * we organise for part of our team each year. The data is obtained from the server.
 */
export function ExportTrainings(props: ExportTrainingsProps) {
    const { trainings } = props;

    return (
        <Stack direction="column" spacing={2}>
            { !!trainings && trainings.sessions.map(({ date, volunteers }, index) =>
                <Paper key={index} sx={{ p: 2 }}>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                        {dayjs(date).format('dddd MMMM D, YYYY')}
                    </Typography>
                    <Alert severity="info" sx={{ mb: 1 }}>
                        This table can be copied and pasted into Google Sheets and Microsoft Excel.
                        Only confirmed participants are included.
                    </Alert>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Full name</TableCell>
                                <TableCell>E-mail address</TableCell>
                                <TableCell>Date of birth</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            { volunteers.map((volunteer, index) =>
                                <TableRow key={index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{volunteer.name}</TableCell>
                                    <TableCell>{volunteer.email}</TableCell>
                                    <TableCell>{volunteer.birthdate}</TableCell>
                                </TableRow> )}
                        </TableBody>
                    </Table>
                </Paper> )}
        </Stack>
    );
}
