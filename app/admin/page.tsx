// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import type { Birthday } from './dashboard/BirthdayCard';
import type { DatabaseStatus } from './dashboard/DatabaseCard';
import type { SchedulerStatus } from './dashboard/SchedulerCard';
import type { User } from '@lib/auth/User';
import { default as TopLevelLayout } from './TopLevelLayout';
import { Dashboard } from './dashboard/Dashboard';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { dayjs } from '@lib/DateTime';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tStorage, tUsers, tUsersEvents } from '@lib/database';

import { globalConnectionPool } from '@lib/database/Connection';
import { globalScheduler } from '@lib/scheduler/SchedulerImpl';

/**
 * Fetches the upcoming birthdays from the database for the given `user`. The considered volunteers
 * will depend on their access level: VolunteerAdministrators get to see everything, whereas other
 * users will have restricted visibility based on the events they participate in.
 */
async function fetchBirthdays(user: User) {
    const currentBirthdays: Birthday[] = [];
    const upcomingBirthdays: Birthday[] = [];

    // Calculate the current and upcoming months, which are the only two we care about.
    const currentDate = new Date();

    const currentMonth = currentDate.getMonth();
    const upcomingMonth = (currentDate.getMonth() + 1) % 12;

    // Only show birthdays for volunteers who helped out in the past X years:
    const thresholdDate = dayjs().subtract(3, 'years');

    const usersJoin = tUsers.forUseInLeftJoin();
    const birthdays = await db.selectFrom(tEvents)
        .innerJoin(tUsersEvents)
            .on(tUsersEvents.eventId.equals(tEvents.eventId))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .leftJoin(usersJoin)
            .on(usersJoin.userId.equals(tUsersEvents.userId))
            .and(usersJoin.birthdate.isNotNull())
        .where(tEvents.eventEndTime.greaterThan(thresholdDate))
            .and(usersJoin.birthdate.getMonth().in([ currentMonth, upcomingMonth ]))
        .select({
            name: usersJoin.firstName.concat(' ').concat(usersJoin.lastName),
            birthdate: usersJoin.birthdate,
        })
        .groupBy(tUsersEvents.userId)
        .orderBy(usersJoin.birthdate.getMonth(), 'asc')
        .orderBy(usersJoin.birthdate.getDate(), 'asc')
        .executeSelectMany();

    for (const birthday of birthdays) {
        if (!birthday.birthdate)
            continue;  // should not happen

        if (birthday.birthdate.getMonth() === currentMonth)
            currentBirthdays.push(birthday as any);
        else
            upcomingBirthdays.push(birthday as any);
    }

    return { currentBirthdays, upcomingBirthdays };
}

/**
 * Main dashboard of the AnimeCon Volunteer Manager. Includes various cards in a masonry layout that
 * give an overview of what's going on. Exact cards depend on the user's access level.
 */
export default async function AdminPage() {
    const { events, user } = await requireAuthenticationContext({ check: 'admin' });

    // TODO: Filter for participating events in `fetchBirthdays`
    const { currentBirthdays, upcomingBirthdays } = await fetchBirthdays(user);

    let databaseStatus: DatabaseStatus | undefined;
    if (can(user, Privilege.SystemAdministrator) && globalConnectionPool) {
        databaseStatus = {
            connections: {
                active: globalConnectionPool.activeConnections(),
                idle: globalConnectionPool.idleConnections(),
                total: globalConnectionPool.totalConnections(),
            },
            taskQueueSize: globalConnectionPool.taskQueueSize(),
        };
    }

    let schedulerStatus: SchedulerStatus | undefined;
    if (can(user, Privilege.SystemAdministrator)) {
        let timeSinceLastExecutionMs: number | undefined = undefined;
        if (globalScheduler.lastExecution !== undefined) {
            const diffNs = process.hrtime.bigint() - globalScheduler.lastExecution;
            const diffMs = diffNs / 1000n / 1000n;

            timeSinceLastExecutionMs = Number(diffMs);
        }

        let timeSinceLastInvocationMs: number | undefined = undefined;
        if (globalScheduler.lastInvocation !== undefined) {
            const diffNs = process.hrtime.bigint() - globalScheduler.lastInvocation;
            const diffMs = diffNs / 1000n / 1000n;

            timeSinceLastInvocationMs = Number(diffMs);
        }

        schedulerStatus = {
            executionCount: Number(globalScheduler.executionCount),
            invocationCount: Number(globalScheduler.invocationCount),
            timeSinceLastExecutionMs,
            timeSinceLastInvocationMs,
            pendingTasks: globalScheduler.taskQueueSize,
        };
    }

    const storageJoin = tStorage.forUseInLeftJoin();

    const dbInstance = db;
    const accessibleEvents = await dbInstance.selectFrom(tEvents)
        .leftJoin(storageJoin)
            .on(storageJoin.fileId.equals(tEvents.eventIdentityId))
        .where(tEvents.eventSlug.in([ ...events.keys() ]))
        .select({
            name: tEvents.eventShortName,
            slug: tEvents.eventSlug,
            startTime: dbInstance.asDateTimeString(tEvents.eventStartTime, 'required'),
            endTime: dbInstance.asDateTimeString(tEvents.eventEndTime, 'required'),
            location: tEvents.eventLocation,
            fileHash: storageJoin.fileHash,
        })
        .orderBy(tEvents.eventStartTime, 'desc')
        .executeSelectMany();

    return (
        <TopLevelLayout>
            <Dashboard accessibleEvents={accessibleEvents} currentBirthdays={currentBirthdays}
                       upcomingBirthdays={upcomingBirthdays} databaseStatus={databaseStatus}
                       schedulerStatus={schedulerStatus} />
        </TopLevelLayout>
    );
}

export const metadata: Metadata = {
    title: 'AnimeCon Volunteer Manager',
};
