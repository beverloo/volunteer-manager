// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Filters } from '../Filters';
import type { LineGraphData } from '../components/LineGraph';
import { RegistrationStatus } from '@lib/database/Types';
import { toLineGraphData } from './toLineGraphData';
import db, { tEvents, tSchedule, tShifts, tShiftsCategories, tRoles, tTeams, tUsersEvents }
    from '@lib/database';

/**
 * Query that gathers the average number of shifts that each volunteer has helped out for, separated
 * by event and team, with data included according to the `filters`.
 */
export async function getAverageShiftsPerVolunteer(filters: Filters): Promise<LineGraphData> {
    const rolesJoin = tRoles.forUseInLeftJoin();
    const scheduleJoin = tSchedule.forUseInLeftJoin();
    const shiftsCategoriesJoin = tShiftsCategories.forUseInLeftJoin();
    const shiftsJoin = tShifts.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    // TODO: Exclude Senior and Staff volunteers
    // TODO: Exclude "free" shifts

    const data = await db.selectFrom(tEvents)
        .innerJoin(tTeams)
            .on(tTeams.teamId.inIfValue(filters.teams))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
                .and(usersEventsJoin.teamId.equals(tTeams.teamId))
                .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .leftJoin(scheduleJoin)
            .on(scheduleJoin.userId.equals(usersEventsJoin.userId))
                .and(scheduleJoin.eventId.equals(usersEventsJoin.eventId))
                .and(scheduleJoin.scheduleDeleted.isNull())
        .where(tEvents.eventId.inIfValue(filters.events))
        .select({
            event: {
                slug: tEvents.eventSlug,
            },
            team: {
                color: tTeams.teamColourLightTheme,
                label: tTeams.teamName,
                slug: tTeams.teamSlug,
            },
            volunteers: db.countDistinct(usersEventsJoin.userId),
            shifts: db.sum(
                db.fragmentWithType('double', 'required').sql`
                    TIMESTAMPDIFF(MINUTE, ${scheduleJoin.scheduleTimeStart},
                                          ${scheduleJoin.scheduleTimeEnd})`
            )
        })
        .groupBy(tEvents.eventId, tTeams.teamId)
        .orderBy(tEvents.eventStartTime)
        .executeSelectMany();

    console.log(data.length);

    const normalisedData = data.map(entry => {
        let averageHours: number = 0;
        if (entry.shifts) {
            averageHours = entry.shifts;
            averageHours /= 60;  // minutes -> hours
            averageHours /= entry.volunteers;
        }

        return {
            ...entry,
            value: averageHours,
        };
    });

    return toLineGraphData(normalisedData);
}
