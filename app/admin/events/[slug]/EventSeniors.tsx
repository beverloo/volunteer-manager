// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';

import { type EventRecentVolunteersProps, VolunteerStack } from './EventRecentVolunteers';

/**
 * The <EventSeniors> component displays the seniors who will participate in this event. Clicking on
 * their avatar will immediately redirect the user to their profile.
 */
export function EventSeniors(props: EventRecentVolunteersProps) {
    return (
        <Card>
            <CardHeader avatar={ <AdminPanelSettingsIcon color="primary" /> }
                        title={`${props.event.shortName} Leadership team`}
                        titleTypographyProps={{ variant: 'subtitle2' }} />
            <Divider />
            <CardContent sx={{ pb: '16px !important' }}>
                <VolunteerStack {...props} />
            </CardContent>
        </Card>
    );
}
