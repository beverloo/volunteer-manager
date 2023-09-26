// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { default as MuiLink } from '@mui/material/Link';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import Typography from '@mui/material/Typography';

import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningOutlinedIcon from '@mui/icons-material/WarningOutlined';

import type { EmailLoggerSeverity } from '@lib/integrations/email/EmailLogger';
import type { GetOutboxDefinition } from '@app/api/admin/outbox/getOutbox';
import { callApi } from '@lib/callApi';
import { dayjs } from '@lib/DateTime';

/**
 * Displays an icon appropriate to the severity level of a log message.
 */
function LogSeverity(props: { severity: EmailLoggerSeverity }) {
    let icon: React.ReactNode = undefined;

    switch (props.severity) {
        case 'trace':
        case 'debug':
            icon = <CircleOutlinedIcon color="action" />;
            break;

        case 'info':
            icon = <InfoOutlinedIcon color="info" />;
            break;

        case 'warn':
            icon = <WarningOutlinedIcon color="warning" />;
            break;

        case 'error':
        case 'fatal':
            icon = <ErrorOutlinedIcon color="error" />;
            break;
    }

    if (!icon)
        return props.severity;

    return <Tooltip title={props.severity}>{icon}</Tooltip>;
}

/**
 * Displays the time offset nicely formatted, relative to the starting time.
 */
function LogTime(props: { time: number }) {
    return (
        <Typography variant="body2" sx={{ color: 'success.main' }}>
            +{Math.round(props.time/10)/100}s
        </Typography>
    );
}

/**
 * Props accepted by the <OutboxMessage> component.
 */
export interface OutboxMessageProps {
    /**
     * ID of the message that's due to be rendered.
     */
    id: number;
}

/**
 * The <OutboxMessage> component displays an individual message that was sent to one of the
 * volunteers. The message content will be retrieved through an API.
 */
export function OutboxMessage(props: OutboxMessageProps) {
    const [ message, setMessage ] = useState<GetOutboxDefinition['response'] | undefined>();

    useEffect(() => {
        setMessage(undefined);
        callApi('get', '/api/admin/outbox/:id', { id: props.id }).then(response => {
            setMessage(response);
        });
    }, [ props.id ]);

    if (!message) {
        return (
            <Paper sx={{ p: 2 }}>
                <Skeleton animation="wave" width="80%" height={12} />
                <Skeleton animation="wave" width="70%" height={12} />
                <Skeleton animation="wave" width="75%" height={12} />
                <Skeleton animation="wave" width="73%" height={12} />
            </Paper>
        );
    }

    const logs = !!message.logs ? JSON.parse(message.logs) : [];

    return (
        <>
            <Paper>
                <Typography sx={{ p: 2 }} variant="h5">
                    Message sent on {dayjs(message.date).format('MMMM D, YYYY [at] H:mm:ss')}
                </Typography>
            </Paper>
            <TableContainer component={Paper}>
                <Table>
                    <TableRow>
                        <TableCell width="25%" component="th" scope="row">From</TableCell>
                        { !message.fromUserId && <TableCell>{message.from}</TableCell> }
                        { !!message.fromUserId &&
                            <TableCell>
                                <MuiLink component={Link}
                                         href={`/admin/volunteers/${message.fromUserId}`}>
                                    {message.from}
                                </MuiLink>
                            </TableCell> }
                    </TableRow>
                    <TableRow>
                        <TableCell component="th" scope="row">To</TableCell>
                        { !message.toUserId && <TableCell>{message.to}</TableCell> }
                        { !!message.toUserId &&
                            <TableCell>
                                <MuiLink component={Link}
                                         href={`/admin/volunteers/${message.toUserId}`}>
                                    {message.to}
                                </MuiLink>
                            </TableCell> }
                    </TableRow>
                    { !!message.cc &&
                        <TableRow>
                            <TableCell component="th" scope="row">Cc</TableCell>
                            <TableCell>{message.cc}</TableCell>
                        </TableRow> }
                    { !!message.bcc &&
                        <TableRow>
                            <TableCell component="th" scope="row">Bcc</TableCell>
                            <TableCell>{message.bcc}</TableCell>
                        </TableRow> }
                    <TableRow>
                        <TableCell component="th" scope="row">Subject</TableCell>
                        <TableCell>{message.subject}</TableCell>
                    </TableRow>
                    { (!!message.headers && message.headers.length > 2) &&
                        <TableRow>
                            <TableCell component="th" scope="row">Headers</TableCell>
                            <TableCell sx={{ whiteSpace: 'pre-line' }}>
                                {JSON.stringify(message.headers)}
                            </TableCell>
                        </TableRow> }
                </Table>
            </TableContainer>
            <Stack direction="row" spacing={2}>
                <Paper sx={{ flexBasis: '100%', p: 2 }}>
                    <Typography variant="body2"
                                sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                        {message.text}
                    </Typography>
                </Paper>
                <Paper sx={{ flexBasis: '100%', p: 2 }}>
                    <Typography variant="body2"
                                sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                        {message.html}
                    </Typography>
                </Paper>
            </Stack>
            { !!message.errorName &&
                <TableContainer component={Paper}>
                    <Table>
                        <TableRow>
                            <TableCell width="25%" component="th" scope="row">Error name</TableCell>
                            <TableCell>{message.errorName}</TableCell>
                        </TableRow>
                        { !!message.errorMessage &&
                            <TableRow>
                                <TableCell component="th" scope="row">Error message</TableCell>
                                <TableCell>{message.errorMessage}</TableCell>
                            </TableRow> }
                        { !!message.errorStack &&
                            <TableRow>
                                <TableCell component="th" scope="row">Stack trace</TableCell>
                                <TableCell sx={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>
                                    {message.errorStack}
                                </TableCell>
                            </TableRow> }
                        { !!message.errorCause &&
                            <TableRow>
                                <TableCell component="th" scope="row">Cause</TableCell>
                                <TableCell sx={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>
                                    {JSON.parse(message.errorCause)}
                                </TableCell>
                            </TableRow> }
                    </Table>
                </TableContainer> }
            <TableContainer component={Paper}>
                <Table>
                    { !!message.messageId &&
                        <TableRow>
                            <TableCell width="25%" component="th" scope="row">Message ID</TableCell>
                            <TableCell>{message.messageId}</TableCell>
                        </TableRow> }
                    { !!message.accepted &&
                        <TableRow>
                            <TableCell component="th" scope="row">Accepted</TableCell>
                            <TableCell>{message.accepted}</TableCell>
                        </TableRow> }
                    { !!message.rejected &&
                        <TableRow>
                            <TableCell component="th" scope="row">Rejected</TableCell>
                            <TableCell>{message.rejected}</TableCell>
                        </TableRow> }
                    { !!message.pending &&
                        <TableRow>
                            <TableCell component="th" scope="row">Pending</TableCell>
                            <TableCell>{message.pending}</TableCell>
                        </TableRow> }
                    { !!message.response &&
                        <TableRow>
                            <TableCell component="th" scope="row">Response</TableCell>
                            <TableCell sx={{ whiteSpace: 'pre-line' }}>
                                {message.response}
                            </TableCell>
                        </TableRow> }
                </Table>
            </TableContainer>
            { !!logs.length &&
                <Paper>
                    <Accordion>
                        <AccordionSummary expandIcon={ <ExpandMoreIcon /> }>
                            <TroubleshootIcon color="info" sx={{ mr: 1.5 }} />
                            Detailed logs
                        </AccordionSummary>
                        <AccordionDetails>
                            <Table sx={{ mt: -2 }}>
                                <TableRow>
                                    <TableCell component="th" width="100" align="center">
                                        <strong>Severity</strong>
                                    </TableCell>
                                    <TableCell component="th" width="100" align="center">
                                        <strong>Time</strong>
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'pre-line' }}>
                                        <strong>Details</strong>
                                    </TableCell>
                                </TableRow>
                                { logs.map((log: any, index: number) =>
                                    <TableRow key={index}>
                                        <TableCell align="center">
                                            <LogSeverity severity={log.severity} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <LogTime time={log.time} />
                                        </TableCell>
                                        <TableCell sx={{ whiteSpace: 'pre-wrap',
                                                         overflowWrap: 'anywhere' }}>
                                            {JSON.stringify(log.params)}
                                        </TableCell>
                                    </TableRow> )}
                            </Table>
                        </AccordionDetails>
                    </Accordion>
                </Paper> }
        </>
    );
}
