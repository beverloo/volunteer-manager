// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

import type { NextPageParams } from '@lib/NextRouterParams';
import { AvailabilityWarning } from '../AvailabilityWarning';
import { HotelConfirmation } from './HotelConfirmation';
import { HotelPreferences } from './HotelPreferences';
import { Markdown } from '@components/Markdown';
import { Privilege, can } from '@lib/auth/Privileges';
import { contextForRegistrationPage } from '../../contextForRegistrationPage';
import { generatePortalMetadataFn } from '../../../generatePortalMetadataFn';
import { getHotelRoomOptions } from './getHotelRoomOptions';
import { getStaticContent } from '@lib/Content';

/**
 * The <EventApplicationHotelsPage> component serves the ability for users to select which hotel
 * they would like to stay in during the event. Not all volunteers have the ability to make this
 * selection, as the number of available hotel rooms is limited.
 */
export default async function EventApplicationHotelsPage(props: NextPageParams<'slug'>) {
    const context = await contextForRegistrationPage(props.params.slug);
    if (!context || !context.registration || !context.user || !context.event.hotelEnabled)
        notFound();  // the event does not exist, or the volunteer is not signed in

    const { environment, event, registration, user } = context;

    const bookings = registration.hotelBookings;
    const eligible = registration.hotelEligible;
    const override = can(user, Privilege.EventHotelManagement);
    const enabled = registration.hotelInformationPublished || override;

    const preferences = registration.hotelPreferences;

    if ((!eligible || !enabled) && !bookings)
        notFound();  // the volunteer is not eligible to a hotel reservation

    if (registration.hotelAvailabilityWindow.status === 'pending' && !override)
        notFound();  // the availability window has not opened yet

    const options = await getHotelRoomOptions(event.eventId);
    const content = await getStaticContent([ 'registration', 'application', 'hotel' ], {
        firstName: user.firstName,
    });

    // ---------------------------------------------------------------------------------------------
    // Logic pertaining to <HotelConfirmation>
    // ---------------------------------------------------------------------------------------------
    const readOnly = bookings.length > 0;

    // ---------------------------------------------------------------------------------------------
    // Data transformation for <HotelPreferences>
    // ---------------------------------------------------------------------------------------------
    const hotelPreferences = {
        ...preferences,
        interested: !!preferences ? (!!preferences.hotelId ? 1 : 0) : undefined,
    };

    return (
        <Stack spacing={2} sx={{ p: 2 }}>
            { !registration.hotelInformationPublished &&
                <Alert severity="warning">
                    Details about the available hotel rooms have not been published yet, which may
                    result in this page appearing incomplete or broken.
                </Alert> }

            <AvailabilityWarning override={override}
                                 window={registration.hotelAvailabilityWindow} />

            { content && <Markdown>{content.markdown}</Markdown> }
            { bookings.length > 0 &&
                <HotelConfirmation bookings={bookings} /> }
            { (eligible || !!registration.hotelPreferences) &&
                <HotelPreferences event={event.slug} team={environment.environmentTeamDoNotUse}
                                  eventDate={event.startTime} hotelOptions={options}
                                  hotelPreferences={hotelPreferences} readOnly={readOnly} /> }

            <MuiLink component={Link} href={`/registration/${event.slug}/application`}>
                « Back to your registration
            </MuiLink>
        </Stack>
    );
}

export const generateMetadata = generatePortalMetadataFn('Hotel preferences');
