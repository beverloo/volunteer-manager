// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AvatarGroup from '@mui/material/AvatarGroup';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';

import { RegistrationStatus } from '@lib/database/Types';
import { Avatar } from '@components/Avatar';

/**
 * Props accepted by the <EventRecentVolunteers> component.
 */
export interface EventRecentVolunteersProps {
    event: {
        /**
         * Slug of the event for which this card is being composed.
         */
        slug: string;
    }

    volunteers: {
        /**
         * Unique ID of the account that belongs to this volunteer.
         */
        userId: number;

        /**
         * Hash of their avatar, if any.
         */
        avatarHash?: string;

        /**
         * Environment name of the team that they're part of, for the URL.
         */
        teamEnvironment: string;

        /**
         * Full name of the volunteer that applied.
         */
        name: string;

        /**
         * Status of this application. Influences where we link them to.
         */
        status: RegistrationStatus;
    }[];
}

/**
 * The <EventRecentVolunteers> component displays the volunteers who have most recently joined the
 * team. Clicking on their avatar will forward the senior (or administrator) to their profile.
 */
export function EventRecentVolunteers(props: EventRecentVolunteersProps) {
    const { event, volunteers } = props;

    return (
        <Card>
            <CardHeader avatar={ <AccessTimeIcon color="primary" /> }
                        title="Latest volunteers to apply"
                        titleTypographyProps={{ variant: 'subtitle2' }}
                        subheader="Based on when we received their application…" />
            <Divider />
            <CardContent sx={{ pb: '16px !important' }}>
                <Stack direction="row" spacing={1}>
                    { volunteers.map((volunteer, index) => {
                        const linkBase = `/admin/events/${event.slug}/${volunteer.teamEnvironment}`;

                        let link: string = '/applications';
                        switch (volunteer.status) {
                            case RegistrationStatus.Accepted:
                            case RegistrationStatus.Cancelled:
                                link = `/volunteers/${volunteer.userId}`;
                                break;
                        }

                        const avatarSrc = volunteer.avatarHash ? `/blob/${volunteer.avatarHash}.png`
                                                               : undefined;

                        return (
                            <MuiLink key={index} component={Link} href={`${linkBase}${link}`}
                                     sx={{ textDecoration: 'none' }}>
                                <Avatar size="large" src={avatarSrc}>
                                    {volunteer.name}
                                </Avatar>
                            </MuiLink>
                        );

                    } )}
                </Stack>
            </CardContent>
        </Card>
    );
}