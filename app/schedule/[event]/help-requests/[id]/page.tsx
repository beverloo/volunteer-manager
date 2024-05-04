// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Step from '@mui/material/Step';
import StepContent from '@mui/material/StepContent';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';

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

import { kHelpRequestColours } from '@app/admin/system/displays/HelpRequestColours';

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

    const [ foreground, background ] = kHelpRequestColours[request.target];

    const received = formatDate(request.date.withTimeZone(event.timezone), 'dddd[, at ]HH:mm');

    let activeStep: number = 0;

    let acknowledged: string | undefined;
    if (!!request.acknowledgedBy && !!request.acknowledgedDate) {
        activeStep++;
        acknowledged = formatDate(
            request.acknowledgedDate.withTimeZone(event.timezone), 'dddd[, at ]HH:mm');
    }

    let closed: string | undefined;
    if (!!request.closedBy && !!request.closedDate) {
        activeStep += 2;
        closed = formatDate(request.closedDate.withTimeZone(event.timezone), 'dddd[, at ]HH:mm');
    }

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
                            subheader="Request received from their Volunteering Display" />
            </Card>
            <Card sx={{ p: 2 }}>
                <Stepper orientation="vertical" activeStep={activeStep}
                         sx={{
                             '& .MuiSvgIcon-root.Mui-active': { color: background },
                             '& .MuiSvgIcon-root.Mui-active text': { fill: foreground },
                             '& .MuiSvgIcon-root.Mui-completed': { color: background },
                             '& .MuiStepContent-root': { pl: '28px' },
                             '& .MuiStepLabel-iconContainer': { pr: 2 },
                         }}>
                    <Step expanded>
                        <StepLabel>Request received</StepLabel>
                        <StepContent>
                            <Typography variant="body2">
                                They requested help on {received}.
                            </Typography>
                        </StepContent>
                    </Step>
                    <Step expanded>
                        <StepLabel>Acknowledged</StepLabel>
                        { !!request.acknowledgedBy &&
                            <StepContent>
                                <Typography variant="body2">
                                    Request was acknowledged by {request.acknowledgedBy} on{' '}
                                    {acknowledged}.
                                </Typography>
                            </StepContent> }
                    </Step>
                    <Step expanded>
                        <StepLabel>Closed</StepLabel>
                        { !!request.closedBy &&
                            <StepContent>
                                <Typography variant="body2">
                                    Request was closed by {request.closedBy} on {closed}:
                                    "<em>{request.closedReason ?? 'no reason'}</em>"
                                </Typography>
                            </StepContent> }
                    </Step>
                </Stepper>
            </Card>
            { /* TODO: Ability to acknowledge the request if that hasn't happened yet */ }
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
