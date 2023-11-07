// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Box from '@mui/material/Box';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { type Content, getStaticContent } from '@lib/Content';
import { Markdown } from '@components/Markdown';
import { RefundConfirmation } from './RefundConfirmation';
import { contextForRegistrationPage } from '../../contextForRegistrationPage';
import { dayjs } from '@lib/DateTime';
import { generatePortalMetadataFn } from '../../../generatePortalMetadataFn';
import db, { tEvents } from '@lib/database';

/**
 * The <EventApplicationRefundPage> component allows volunteers to request a refund for their ticket
 * after the event has finished. Availability of this page is time limited and can be configured by
 * specific event administrators.
 */
export default async function EventApplicationRefundPage(props: NextRouterParams<'slug'>) {
    const context = await contextForRegistrationPage(props.params.slug);
    if (!context || !context.registration || !context.user)
        notFound();  // the event does not exist, or the volunteer is not signed in

    const { event, registration, user } = context;

    // Determine the window within which volunteers can request refunds, which can be configured by
    // refund administrators. The content of this page will depend on that.
    const refundAvailability = await db.selectFrom(tEvents)
        .where(tEvents.eventId.equals(event.eventId))
        .select({
            refundsStartTime: tEvents.eventRefundsStartTime,
            refundsEndTime: tEvents.eventRefundsEndTime,
        })
        .executeSelectOne();

    let state: 'available' | 'too-early' | 'too-late' | 'unavailable';
    let content: Content | undefined;

    const contentPath = [ 'registration', 'application' ];
    const currentTime = dayjs();

    if (!refundAvailability.refundsStartTime || !refundAvailability.refundsEndTime) {
        state = 'unavailable';
        content = await getStaticContent([ ...contentPath, 'refund-unavailable' ], {
            event: event.shortName,
            firstName: user.firstName,
        });
    } else {
        const substitutions = {
            event: event.shortName,
            firstName: user.firstName,
            refundsStartTime: dayjs(refundAvailability.refundsStartTime).format('dddd, MMMM D'),
            refundsEndTime: dayjs(refundAvailability.refundsEndTime).format('dddd, MMMM D'),
        };

        if (currentTime.isBefore(refundAvailability.refundsStartTime)) {
            state = 'too-early';
            content = await getStaticContent([ ...contentPath, 'refund-early' ], substitutions);
        } else if (currentTime.isAfter(refundAvailability.refundsEndTime)) {
            state = 'too-late';
            content = await getStaticContent([ ...contentPath, 'refund-late' ], substitutions);
        } else {
            state = 'available';
            content = await getStaticContent([ ...contentPath, 'refund' ], substitutions);
        }
    }

    return (
        <Box sx={{ p: 2 }}>
            { content && <Markdown>{content.markdown}</Markdown> }
            { !!registration.refund &&
                <RefundConfirmation confirmed={registration.refund.confirmed}
                                    requested={registration.refund.requested} /> }
            { (!!registration.refund || state === 'available') &&
                <p>Form goes here...</p> }
            <MuiLink component={Link} href={`/registration/${event.slug}/application`}>
                « Back to your registration
            </MuiLink>
        </Box>
    );
}

export const generateMetadata = generatePortalMetadataFn('Ticket refunds');
