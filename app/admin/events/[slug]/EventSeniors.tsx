// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Image from 'next/image';
import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { type EventRecentVolunteersProps, VolunteerStack } from './EventRecentVolunteers';

/**
 * Props accepted by the <EventSeniors> component.
 */
export type EventSeniorsProps = EventRecentVolunteersProps & {
    /**
     * An invaluable piece of Del a Rie advice to include on the dashboard.
     */
    advice?: string;
};

/**
 * The <EventSeniors> component displays the seniors who will participate in this event. Clicking on
 * their avatar will immediately redirect the user to their profile.
 */
export function EventSeniors(props: EventSeniorsProps) {
    return (
        <>
            <Card>
                <CardHeader avatar={ <AdminPanelSettingsIcon color="primary" /> }
                            title={`${props.event.shortName} Leadership team`}
                            titleTypographyProps={{ variant: 'subtitle2' }} />
                <Divider />
                <CardContent sx={{ pb: '16px !important' }}>
                    <VolunteerStack {...props} />
                </CardContent>
            </Card>
            { !!props.advice &&
                <Paper sx={{ p: 2, mt: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between"
                           divider={ <Divider orientation="vertical" flexItem /> }>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', flexBasis: '100%' }}>
                            “{props.advice}”
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                            <MuiLink component={Link} href="https://delarieadvies.nl">
                                <Image src="/images/advice.png" width="80" height="59"
                                       alt="Del a Rie Advies" />
                            </MuiLink>
                        </Box>
                    </Stack>
                </Paper> }
        </>
    );
}
