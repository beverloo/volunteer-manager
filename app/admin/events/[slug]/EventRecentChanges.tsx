// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '../verifyAccessAndFetchPageInfo';
import { RegistrationStatus } from '@lib/database/Types';
import { Temporal, formatDuration } from '@lib/Temporal';

/**
 * Whether the volunteer's application `status` is still pending.
 */
function isApplicationPending(status: RegistrationStatus): boolean {
    return status === RegistrationStatus.Registered ||
           status === RegistrationStatus.Rejected;
}

/**
 * Props accepted by the <EventRecentChanges> component.
 */
export interface EventRecentChangesProps {
    event: PageInfo['event'];

    /**
     * The changes that were made that should be highlighted here.
     */
    changes: {
        /**
         * Name of the volunteer who made a change.
         */
        name: string;

        /**
         * User ID and team environment name of the person who made the change, so that we can
         * provide a link directly to their account.
         */
        userId: number;
        team: string;

        /**
         * Registration status of this volunteer. Applications are shown, but will have to be linked
         * to another place compared to regular volunteers.
         */
        status: RegistrationStatus;

        /**
         * Textual description of the update - what changed?
         */
        update: string;

        /**
         * Date and time during which the update was made.
         */
        date: Temporal.ZonedDateTime | string;
    }[];
}

/**
 * The <EventRecentChanges> component displays changes that were recently made by volunteers in
 * context of this event, such as sharing their preferences. Only a few highlights are shown.
 */
export function EventRecentChanges(props: EventRecentChangesProps) {
    const currentTime = Temporal.Now.zonedDateTimeISO('UTC');

    return (
        <Card>
            <CardHeader avatar={ <RssFeedIcon color="primary" /> }
                        title="Latest changes made by volunteers"
                        titleTypographyProps={{ variant: 'subtitle2' }} />
            <Divider />
            <Stack direction="column" divider={ <Divider flexItem /> }>
                { props.changes.map((change, index) => {
                    const href =
                        isApplicationPending(change.status)
                            ? `./${props.event.slug}/${change.team}/applications`
                            : `./${props.event.slug}/${change.team}/volunteers/${change.userId}`;

                    return (
                        <Stack key={index} direction="row" justifyContent="space-between"
                               alignItems="center" sx={{ mx: 2, my: 1 }}>
                            <Typography variant="body2">
                                <MuiLink component={Link} href={href} sx={{ pr: 0.5 }}>
                                    {change.name}
                                </MuiLink>
                                {change.update}
                            </Typography>
                            <Typography variant="body2">
                                { formatDuration(
                                    Temporal.ZonedDateTime.from(change.date).since(
                                        currentTime, { largestUnit: 'years' })) }
                            </Typography>
                        </Stack>
                    );
                } )}

            </Stack>
        </Card>
    );
}
