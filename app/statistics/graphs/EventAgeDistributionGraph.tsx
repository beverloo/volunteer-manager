// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type DashboardBarGraphSeries, DashboardGraph } from '../DashboardGraph';
import { RegistrationStatus } from '@lib/database/Types';
import db, { tEvents, tUsersEvents, tUsers } from '@lib/database';

/**
 * Graph that displays the age distribution for a given event, identified by its `eventId`.
 */
export async function EventAgeDistributionGraph(props: { eventId: number; teamId: number }) {
    const dbInstance = db;
    const distribution = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tUsersEvents.eventId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .where(tUsersEvents.eventId.equals(props.eventId))
            .and(tUsersEvents.teamId.equals(props.teamId))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
            .and(tUsers.birthdate.isNotNull())
        .select({
            age: dbInstance.fragmentWithType('int', 'required').sql`
                TIMESTAMPDIFF(YEAR, ${tUsers.birthdate}, ${tEvents.eventStartTime})`,
            gender: tUsers.gender,
            count: dbInstance.count(tUsersEvents.userId),
        })
        .groupBy('age', 'gender')
        .orderBy('age', 'asc')
        .orderBy('gender', 'asc')
        .executeSelectMany();

    let minimumAge: number | undefined = Number.MAX_SAFE_INTEGER;
    let maximumAge: number | undefined = Number.MIN_SAFE_INTEGER;
    const genders: Record<string, number> = {};

    for (const { age, gender } of distribution) {
        genders[gender] = 0;

        if (minimumAge > age)
            minimumAge = age;
        if (maximumAge < age)
            maximumAge = age;
    }

    const groupedData = new Map<number, Record<string, number>>();
    for (let age = minimumAge; age <= maximumAge; ++age)
        groupedData.set(age, structuredClone(genders));

    for (const { age, gender, count } of distribution)
        groupedData.get(age)![gender] = count;

    const labels = [ ...groupedData.keys() ].map(v => `${v}`);
    const series: DashboardBarGraphSeries = [];

    for (const gender of Object.keys(genders)) {
        const genderSeries: DashboardBarGraphSeries[number] = {
            type: 'bar',
            label: gender,
            data: []
        };

        for (const [ age, countPerGender ] of groupedData.entries())
            genderSeries.data!.push(countPerGender[gender]);

        series.push(genderSeries);
    }

    return <DashboardGraph title="Age distribution" presentation="bar" data={series}
                           labels={labels} />;
}
