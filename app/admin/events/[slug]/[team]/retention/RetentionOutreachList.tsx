// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Table from '@mui/material/Table';
import Typography from '@mui/material/Typography';

/**
 * Props accepted by the <RetentionOutreachList> component.
 */
export interface RetentionOutreachListProps {
    /**
     * Array of the assigned volunteers that are still on this person's to-do list to conclude.
     */
    assignedVolunteers: {
        id: number;
        name: string;
        email?: string;
        phoneNumber?: string;
    }[];
}

/**
 * The <RetentionOutreachList> component displays the list of volunteers that the signed in user is
 * expected to reach out to. It mentions their contact information, and has some shortcut buttons to
 * conveniently progress the state of the outreach.
 */
export function RetentionOutreachList(props: RetentionOutreachListProps) {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                Your outreach tasks
            </Typography>
            <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                You are expected to reach out to the following volunteers and ask if they want to
                participate again—even if it's in one of the other teams. Volunteers will be removed
                from this list once they apply or decline to participate.
            </Alert>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell width="34%">Volunteer</TableCell>
                        <TableCell width="33%">E-mail address</TableCell>
                        <TableCell width="33%">Phone number</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    { props.assignedVolunteers.map(volunteer =>
                        <TableRow key={volunteer.id}>
                            <TableCell>{volunteer.name}</TableCell>
                            <TableCell>{volunteer.email}</TableCell>
                            <TableCell>{volunteer.phoneNumber}</TableCell>
                        </TableRow> )}
                </TableBody>
            </Table>
        </Paper>
    );
}
