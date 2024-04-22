// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardActionArea from '@mui/material/CardActionArea';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { DisplayHelpRequestStatus } from '@lib/database/Types';

/**
 * Props accepted by the <RequestHelpCard> component.
 */
export interface RequestHelpCardProps {
    /**
     * The current status of the help request.
     */
    status?: DisplayHelpRequestStatus;
}

/**
 * The <RequestHelpCard> card displays the option for the location staff of this device to ping
 * one of the Volunteering Leads for help. A dialog will be shown with options about the nature of
 * their call, and the status of their request will be reflected in the card.
 */
export function RequestHelpCard(props: RequestHelpCardProps) {
    const { status } = props;

    return (
        <Paper>
            <Box sx={{
                backgroundImage: 'url(/images/request-help.jpg)',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                borderTopLeftRadius: theme => theme.shape.borderRadius,
                borderTopRightRadius: theme => theme.shape.borderRadius,
                filter: 'grayscale(0.8)',
                width: '100%',
                aspectRatio: 6 }} />
            <CardActionArea sx={{ p: 2 }}>
                <Typography variant="body1" sx={{ pb: 2 }}>
                    You can request help from a Volunteering Lead in case of safety or security
                    concerns, or when scheduled volunteers did not show up.
                </Typography>
                { status === DisplayHelpRequestStatus.Acknowledged &&
                    <Button fullWidth color="warning" variant="contained"
                            startIcon={ <CircularProgress color="inherit" thickness={6}
                                                          size={16} sx={{ mr: 0.5 }} /> }>
                        Help is on its way
                    </Button> }
                { status === DisplayHelpRequestStatus.Pending &&
                    <Button fullWidth color="error" variant="contained"
                            startIcon={ <CircularProgress color="inherit" thickness={6}
                                                          size={16} sx={{ mr: 0.5 }} /> }>
                        Help has been requested
                    </Button> }
                { !status &&
                    <Button fullWidth color="secondary" variant="outlined">
                        Request help
                    </Button> }
            </CardActionArea>
        </Paper>
    );
}
