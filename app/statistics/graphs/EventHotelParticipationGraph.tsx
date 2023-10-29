// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { DashboardGraph } from '../DashboardGraph';
import { RegistrationStatus } from '@lib/database/Types';
import { computeColor } from '../ColorUtils';
import db, { tHotelsAssignments, tHotelsBookings, tRoles, tUsersEvents } from '@lib/database';

/**
 * Graph that displays hotel room participation in the training sessions for a particular event.
 */
export async function EventHotelParticipationGraph(props: { eventId: number; teamId: number }) {
    const hotelsAssignmentsJoin = tHotelsAssignments.forUseInLeftJoin();
    const hotelsBookingsJoin = tHotelsBookings.forUseInLeftJoin();

    const distribution = await db.selectFrom(tUsersEvents)
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .leftJoin(hotelsAssignmentsJoin)
            .on(hotelsAssignmentsJoin.eventId.equals(tUsersEvents.eventId))
            .and(hotelsAssignmentsJoin.assignmentUserId.equals(tUsersEvents.userId))
        .leftJoin(hotelsBookingsJoin)
            .on(hotelsBookingsJoin.bookingId.equals(hotelsAssignmentsJoin.bookingId))
        .where(tUsersEvents.eventId.equals(props.eventId))
            .and(tUsersEvents.teamId.equals(props.teamId))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .select({
            eligible: tUsersEvents.hotelEligible.valueWhenNull(tRoles.roleHotelEligible),
            booked: hotelsBookingsJoin.bookingHotelId.isNotNull().and(
                hotelsBookingsJoin.bookingVisible.equals(/* true= */ 1)),
        })
        .executeSelectMany();

    let totalCount: number = 0;
    let notEligibleCount: number = 0;
    let eligibleCount: number = 0;
    let bookedCount: number = 0;

    for (const { eligible, booked } of distribution) {
        totalCount++;

        if (booked)
            bookedCount++;
        else if (eligible)
            eligibleCount++;
        else
            notEligibleCount++;
    }

    const data = [
        {
            id: 0,
            color: computeColor('error'),
            label: 'Not eligible',
            value: notEligibleCount,
        },
        {
            id: 1,
            color: computeColor('warning'),
            label: 'No booking',
            value: eligibleCount,
        },
        {
            id: 2,
            color: computeColor('success'),
            label: 'Room booked',
            value: bookedCount,
        }
    ];

    let conclusion: string | undefined = undefined;
    if (totalCount > 0)
        conclusion = `${Math.round((bookedCount / totalCount) * 10000) / 100}% booked a hotel room`;

    return <DashboardGraph title="Hotel room bookings" presentation="pie" data={data}
                           conclusion={conclusion} />;
}
