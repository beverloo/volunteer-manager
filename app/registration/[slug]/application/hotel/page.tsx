// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Box from '@mui/material/Box';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { HotelPreferences } from './HotelPreferences';
import { Markdown } from '@app/components/Markdown';
import { contextForRegistrationPage } from '../../contextForRegistrationPage';
import { getStaticContent } from '@lib/Content';
import db, { tHotels } from '@lib/database';

/**
 * Returns the hotel room options that are available for `eventId`, formatted in a manner that's
 * appropriate to be used on the hotel room preference form.
 */
export async function getHotelRoomOptions(eventId: number) {
    const hotelOptions = await db.selectFrom(tHotels)
        .where(tHotels.eventId.equals(eventId))
            .and(tHotels.hotelRoomVisible.equals(/* true= */ 1))
        .select({
            hotelId: tHotels.hotelId,
            hotelName: tHotels.hotelName,
            hotelRoom: tHotels.hotelRoomName,
            hotelRoomPeople: tHotels.hotelRoomPeople,
            hotelRoomPrice: tHotels.hotelRoomPrice,
        })
        .orderBy(tHotels.hotelName, 'asc')
        .orderBy(tHotels.hotelRoomName, 'asc')
        .executeSelectMany();

    const kPriceFormatter = new Intl.NumberFormat('en-UK', { style: 'currency', currency: 'EUR' });
    return hotelOptions.map(option => {
        const price = kPriceFormatter.format(option.hotelRoomPrice / 100);
        return {
            id: option.hotelId,
            label: `${option.hotelName} (${option.hotelRoom}) - ${price}/room/night`,
        };
    });
}

/**
 * The <EventApplicationHotelsPage> component serves the ability for users to select which hotel
 * they would like to stay in during the event. Not all volunteers have the ability to make this
 * selection, as the number of available hotel rooms is limited.
 */
export default async function EventApplicationHotelsPage(props: NextRouterParams<'slug'>) {
    const context = await contextForRegistrationPage(props.params.slug);
    if (!context || !context.registration || !context.user)
        notFound();  // the event does not exist, or the volunteer is not signed in

    const { environment, event, registration, user } = context;
    if (!registration.hotelEligible && !registration.hotel)
        notFound();  // the volunteer is not eligible to a hotel reservation

    const content = await getStaticContent([ 'registration', 'application', 'hotel' ]);
    const substitutedContent =
        content ? content.markdown.replaceAll('{firstName}', user.firstName)
                : undefined;

    const hotelOptions = await getHotelRoomOptions(event.eventId);
    const hotelPreferences = {
        ...registration.hotel,
        interested: !!registration.hotel ? (!!registration.hotel.hotelId ? 1 : 0)
                                         : undefined,
    };

    // TODO: Alert confirming financial risk
    // TODO: Confirmation once booked

    return (
        <Box sx={{ p: 2 }}>
            { substitutedContent && <Markdown>{substitutedContent}</Markdown> }
            <HotelPreferences environment={environment.environmentName} eventSlug={event.slug}
                              eventDate={event.startTime} hotelOptions={hotelOptions}
                              hotelPreferences={hotelPreferences} />
            <MuiLink component={Link} href={`/registration/${event.slug}/application`}>
                « Back to your registration
            </MuiLink>
        </Box>
    );
}
