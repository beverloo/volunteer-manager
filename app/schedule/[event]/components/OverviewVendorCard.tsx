// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import React, { useCallback, useContext, useState } from 'react';

import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardHeader from '@mui/material/CardHeader';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import SecurityIcon from '@mui/icons-material/Security';

import { CalendarPopover } from './CalendarPopover';
import { ScheduleContext } from '../ScheduleContext';
import { VendorTeam } from '@lib/database/Types';
import { concatenateNames } from '../lib/concatenateNames';

/**
 * Header to use for the vendor card, depending on the team.
 */
const kVendorCardHeader: { [k in VendorTeam]: string } = {
    [VendorTeam.FirstAid]: 'First Aid team',
    [VendorTeam.Security]: 'Security team',
};

/**
 * Icons to show on the the vendor cards, which depends on the team the card is representing.
 */
const kVendorCardIcon: { [k in VendorTeam]: React.ReactNode } = {
    [VendorTeam.FirstAid]: <LocalHospitalIcon color="primary" />,
    [VendorTeam.Security]: <SecurityIcon color="primary" />,
};

/**
 * Props accepted by the <OverviewVendorCard> component.
 */
export interface OverviewVendorCardProps {
    /**
     * The vendor team for whom this card should be displayed.
     */
    team: VendorTeam;
}

/**
 * The <OverviewVendorCard> component displays an overview card for one of the vendor teams. All on-
 * site personnel will be shown on the card, whereas seniors can click through to a full calendar
 * view displaying the team's full schedule.
 */
export function OverviewVendorCard(props: OverviewVendorCardProps) {
    const schedule = useContext(ScheduleContext);

    const [ calendarOpen, setCalendarOpen ] = useState<boolean>(false);
    const handleOpenCalendar = useCallback(() => setCalendarOpen(true), [ /* no deps */ ]);
    const handleCloseCalendar = useCallback(() => setCalendarOpen(false), [ /* no deps */ ]);

    if (!schedule || !schedule.vendors[props.team])
        return undefined;  // this team does not exist

    const vendor = schedule.vendors[props.team]!;
    if (!vendor.active.length && !vendor.schedule.length)
        return undefined;  // this team has no representation

    const title = kVendorCardHeader[props.team];
    const subheader = !!vendor.active.length ? `${concatenateNames(vendor.active)} are on location`
                                             : 'No personnel is currently on location';

    if (!vendor.schedule.length) {
        return (
            <Card>
                <CardHeader avatar={ kVendorCardIcon[props.team] }
                            title={title} titleTypographyProps={{ variant: 'subtitle2' }}
                            subheader={subheader} />
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardActionArea onClick={handleOpenCalendar}
                                sx={{ '& .MuiCardHeader-action': { alignSelf: 'center',
                                                                   pr: 1, pt: 0.5 } }}>

                    <CardHeader action={ <ReadMoreIcon color="disabled" /> }
                                avatar={ kVendorCardIcon[props.team] }
                                title={title} titleTypographyProps={{ variant: 'subtitle2' }}
                                subheader={subheader} />

                </CardActionArea>
            </Card>
            <CalendarPopover open={calendarOpen} onClose={handleCloseCalendar}
                             title={title} />
        </>
    );
}
