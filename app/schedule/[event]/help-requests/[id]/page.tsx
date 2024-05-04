// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import type { NextPageParams } from '@lib/NextRouterParams';
import { DisplayHelpRequestTarget } from '@lib/database/Types';
import { HelpRequestTarget } from '../../components/HelpRequestTarget';
import { Privilege } from '@lib/auth/Privileges';
import { SetTitle } from '../../components/SetTitle';
import {  formatDate } from '@lib/Temporal';
import { generateScheduleMetadata, getTitleCache } from '../../lib/generateScheduleMetadataFn';
import { getEventBySlug } from '@lib/EventLoader';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tDisplays, tDisplaysRequests, tUsers } from '@lib/database';

/**
 * The <ScheduleHelpRequestPage> component displays a page for a given help request. It's only
 * available for volunteers with a specific permission, as it potentially could contain sensitive
 * information.
 */
export default async function ScheduleHelpRequestPage(props: NextPageParams<'event' | 'id'>) {
    await requireAuthenticationContext({
        check: 'event',
        event: props.params.event,
        privilege: Privilege.EventHelpRequests,
    });

    const event = await getEventBySlug(props.params.event);
    if (!event)
        notFound();

    const acknowledgedUserJoin = tUsers.forUseInLeftJoinAs('auj');
    const closedUserJoin = tUsers.forUseInLeftJoinAs('cuj');

    const request = await db.selectFrom(tDisplaysRequests)
        .innerJoin(tDisplays)
            .on(tDisplays.displayId.equals(tDisplaysRequests.displayId))
        .leftJoin(acknowledgedUserJoin)
            .on(acknowledgedUserJoin.userId.equals(tDisplaysRequests.requestAcknowledgedBy))
        .leftJoin(closedUserJoin)
            .on(closedUserJoin.userId.equals(tDisplaysRequests.requestClosedBy))
        .where(tDisplaysRequests.requestEventId.equals(event.id))
            .and(tDisplaysRequests.requestId.equals(parseInt(props.params.id, /* radix= */ 10)))
        .select({
            id: tDisplaysRequests.requestId,
            date: tDisplaysRequests.requestReceivedDate,
            target: tDisplaysRequests.requestReceivedTarget,
            display: tDisplays.displayLabel.valueWhenNull(tDisplays.displayIdentifier),

            acknowledgedBy: acknowledgedUserJoin.name,
            acknowledgedDate: tDisplaysRequests.requestAcknowledgedDate,

            closedBy: closedUserJoin.name,
            closedDate: tDisplaysRequests.requestClosedDate,
            closedReason: tDisplaysRequests.requestClosedReason,
        })
        .executeSelectNoneOrOne();

    if (!request)
        notFound();

    const received = formatDate(request.date.withTimeZone(event.timezone), 'HH:mm[ on ]dddd');
    const target =
        request.target === DisplayHelpRequestTarget.Nardo ? 'Nardo\'s Advice'
                                                          : request.target;

    return (
        <>
            <SetTitle title={request.display} />
            <Card>
                <Box sx={{
                    backgroundImage: 'url(/images/help-request.jpg)',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    width: '100%',
                    aspectRatio: 4 }} />
            </Card>
            <Card>
                <CardHeader avatar={ <HelpRequestTarget target={request.target} /> }
                            title={`${request.display} asks for ${target}`}
                            titleTypographyProps={{ variant: 'subtitle2' }}
                            subheader={`Request received at ${received}`} />
            </Card>
            { /* TODO: Show information about who acknowledged the request */ }
            { /* TODO: Ability to acknowledge the request if that hasn't happened yet */ }
            { /* TODO: Show information about who closed the request, and why */ }
            { /* TODO: Ability to close the request if that hasn't happened yet */ }
        </>
    );
}

export async function generateMetadata(props: NextPageParams<'event' | 'id'>) {
    const cache = getTitleCache('help-requests');

    let displayName = cache.get(props.params.id);
    if (!displayName) {
        displayName = await db.selectFrom(tDisplaysRequests)
            .innerJoin(tDisplays)
                .on(tDisplays.displayId.equals(tDisplaysRequests.displayId))
            .where(tDisplaysRequests.requestId.equals(parseInt(props.params.id, /* radix= */ 10)))
            .selectOneColumn(tDisplays.displayLabel)
            .executeSelectNoneOrOne() ?? 'Unknown display';

        cache.set(props.params.id, displayName);
    }

    return generateScheduleMetadata(props, [ displayName!, 'Help Requests' ]);
}
