// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useMemo } from 'react';

import type { SvgIconProps } from '@mui/material/SvgIcon';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CelebrationIcon from '@mui/icons-material/Celebration';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Temporal, formatDate } from '@lib/Temporal';

/**
 * Information that describes a singular volunteer birthday throughout the system.
 */
export interface Birthday {
    /**
     * Name of the volunteer whose birthday it is.
     */
    name: string;

    /**
     * The date on which this person celebrates their birthday. Represented in a Temporal PlainDate-
     * compatible serialization.
     */
    birthdate: string;

    /**
     * Whether the volunteer has been a leader in our organisation.
     */
    leader?: boolean;
}

/**
 * Props accepted by the <BirthdayCard> component.
 */
interface BirthdayCardProps {
    /**
     * Birthdays that should be rendered in the component.
     */
    birthdays: Birthday[];

    /**
     * Whether this card represents upcoming birthdays. Affects the header image.
     */
    upcoming?: boolean;
}

/**
 * The <BirthdayCard> component displays a card which lists the volunteers with birthdays in a
 * particular month. No particular interaction is provided, but we don't want to forget either.
 */
export function BirthdayCard(props: BirthdayCardProps) {
    const today = useMemo(() => Temporal.Now.plainDateISO(), [ /* no deps */ ]);

    const month = formatDate(Temporal.PlainDate.from(props.birthdays[0].birthdate), 'MMMM');
    const image = !!props.upcoming ? '/images/admin/birthday-header-2.jpg'
                                   : '/images/admin/birthday-header-1.jpg';

    return (
        <Card>
            <CardMedia sx={{ aspectRatio: 2, backgroundPositionY: '75%' }}
                       image={image} title="Birthdays" />
            <CardContent sx={{ pb: '8px !important' }}>
                <Typography variant="h5" sx={{ pb: 1 }}>
                    {month}
                </Typography>
                <List dense disablePadding>
                    { props.birthdays.map(({ name, birthdate, leader }, index) => {
                        const plainBirthdate = Temporal.PlainDate.from(birthdate);
                        const plainBirthdateThisYear = plainBirthdate.with({ year: today.year });

                        const daysUntilBirthday =
                            today.until(plainBirthdateThisYear, { largestUnit: 'days' }).days;

                        const iconColour: SvgIconProps['color'] =
                            daysUntilBirthday < 0
                                ? 'disabled'
                                : daysUntilBirthday === 0
                                    ? 'warning'
                                    : daysUntilBirthday < 7
                                        ? 'primary'
                                        : 'action';

                        return (
                            <ListItem disableGutters key={index}>
                                <ListItemIcon sx={{ minWidth: '40px' }}>
                                    <CelebrationIcon color={iconColour} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={name}
                                    secondary={formatDate(plainBirthdate, 'MMMM D')}
                                    slotProps={{
                                        primary: {
                                            sx: {
                                                fontWeight: daysUntilBirthday === 0 ? '500' : '400',
                                            }
                                        }
                                    }} />
                                { !!leader &&
                                    <Tooltip title="This person has been a volunteering lead">
                                        <StarBorderIcon color="disabled" />
                                    </Tooltip>}
                            </ListItem>
                        );
                    }) }
                </List>
            </CardContent>
        </Card>
    )
}
