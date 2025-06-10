// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import type { Birthday } from './dashboard/BirthdayCard';
import type { DatabaseStatus } from './dashboard/DatabaseCard';
import type { SchedulerStatus } from './dashboard/SchedulerCard';
import type { User } from '@lib/auth/User';
import { default as TopLevelLayout } from './TopLevelLayout';
import { Dashboard } from './dashboard/Dashboard';
import { Temporal } from '@lib/Temporal';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tRoles, tStorage, tUsers, tUsersEvents } from '@lib/database';

import { getConnectionPool } from '@lib/database/Connection';
import { globalScheduler } from '@lib/scheduler/SchedulerImpl';

import { kRegistrationStatus } from '@lib/database/Types';

/**
 * Fetches the upcoming birthdays from the database for the given `user`. The considered volunteers
 * will depend on their access level: VolunteerAdministrators get to see everything, whereas other
 * users will have restricted visibility based on the events they participate in.
 */
async function fetchBirthdays(user: User) {
    const currentBirthdays: Birthday[] = [];
    const upcomingBirthdays: Birthday[] = [];

    // Calculate the current and upcoming months, which are the only two we care about.
    const currentMonth = Temporal.Now.zonedDateTimeISO('utc');
    const nextMonth = currentMonth.add({ months: 1 });

    // Only show birthdays for volunteers who helped out in the past X years:
    const thresholdDate = Temporal.Now.zonedDateTimeISO('UTC').subtract({ years: 3 });

    const birthdays = await db.selectFrom(tEvents)
        .innerJoin(tUsersEvents)
            .on(tUsersEvents.eventId.equals(tEvents.eventId))
            .and(tUsersEvents.registrationStatus.equals(kRegistrationStatus.Accepted))
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
            .and(tUsers.birthdate.isNotNull())
        .where(tEvents.eventEndTime.greaterThan(thresholdDate))
        .select({
            name: tUsers.name,
            birthdate: tUsers.birthdate,
            leader: db.aggregateAsArrayOfOneColumn(tRoles.rolePermissionGrant),
        })
        .groupBy(tUsers.userId)
        .executeSelectMany();

    birthdays.sort((lhs, rhs) => {
        if (!lhs.birthdate || !rhs.birthdate)
            throw new Error('Unexpected nullsy value seen in the birthday selection');

        if (lhs.birthdate.day === rhs.birthdate.day)
            return lhs.name?.localeCompare(rhs.name!) ?? 0;

        return lhs.birthdate.day - rhs.birthdate.day;
    });

    for (const birthday of birthdays) {
        if (!birthday.birthdate || !birthday.name)
            continue;  // should not happen

        const entry: Birthday = {
            ...birthday,
            birthdate: birthday.birthdate.toString(),
            leader: birthday.leader.length > 0,
        };

        if (birthday.birthdate.month === currentMonth.month)
            currentBirthdays.push(entry);
        else if (birthday.birthdate.month === nextMonth.month)
            upcomingBirthdays.push(entry);
    }

    return { currentBirthdays, upcomingBirthdays };
}

/**
 * Main dashboard of the AnimeCon Volunteer Manager. Includes various cards in a masonry layout that
 * give an overview of what's going on. Exact cards depend on the user's access level.
 */
export default async function AdminPage() {
    const { access, events, user } = await requireAuthenticationContext({ check: 'admin' });

    const { currentBirthdays, upcomingBirthdays } = await fetchBirthdays(user);

    const connectionPool = getConnectionPool();
    let databaseStatus: DatabaseStatus | undefined;

    if (access.can('system.internals') && connectionPool) {
        databaseStatus = {
            connections: {
                active: connectionPool.activeConnections(),
                idle: connectionPool.idleConnections(),
                total: connectionPool.totalConnections(),
            },
            taskQueueSize: connectionPool.taskQueueSize(),
        };
    }

    let schedulerStatus: SchedulerStatus | undefined;
    if (access.can('system.internals.scheduler')) {
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
            startTime: dbInstance.dateTimeAsString(tEvents.eventStartTime),
            endTime: dbInstance.dateTimeAsString(tEvents.eventEndTime),
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
