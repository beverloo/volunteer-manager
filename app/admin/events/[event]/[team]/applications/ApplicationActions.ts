// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { executeServerAction } from '@lib/serverAction';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tTeams, tTeamsRoles, tUsersEvents } from '@lib/database';

import { kRegistrationStatus, kShirtFit, kShirtSize } from '@lib/database/Types';
import { kServiceHoursProperty, kServiceTimingProperty } from '@app/api/event/application';

/**
 * Fetches the unique ID of the event identified by the given `event` slug.
 */
async function getEventId(event: string): Promise<number | undefined> {
    return await db.selectFrom(tEvents)
        .where(tEvents.eventSlug.equals(event))
        .selectOneColumn(tEvents.eventId)
        .executeSelectNoneOrOne() ?? undefined;
}

/**
 * Zod type that describes that no data is expected.
 */
const kNoDataRequired = z.object({ /* no parameters */ });

/**
 * Server action that should be called when an application should be approved.
 */
export async function approveApplication(
    event: string, team: string, userId: number, formData: unknown)
{
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: {
                permission: 'event.applications',
                operation: 'update',
                scope: { event, team },
            },
        });

        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Zod type that describes the data required to create a new application.
 */
const kCreateApplicationData = z.object({
    userId: z.number(),
    tshirtSize: z.nativeEnum(kShirtSize),
    tshirtFit: z.nativeEnum(kShirtFit),
    serviceHours: kServiceHoursProperty,
    serviceTiming: kServiceTimingProperty,
    preferences: z.string().optional(),
});

/**
 * Server action that should be called when a new application should be created.
 */
export async function createApplication(event: string, team: string, formData: unknown) {
    'use server';
    return executeServerAction(formData, kCreateApplicationData, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: {
                permission: 'event.applications',
                operation: 'create',
                scope: { event, team },
            },
        });

        const eventId = await getEventId(event);
        if (!eventId)
            return { success: false, error: 'Unable to identify the appropriate event…' };

        const dbInstance = db;
        const teamInfo = await dbInstance.selectFrom(tTeams)
            .innerJoin(tTeamsRoles)
                .on(tTeamsRoles.teamId.equals(tTeams.teamId))
                    .and(tTeamsRoles.roleDefault.equals(/* true= */ 1))
            .where(tTeams.teamSlug.equals(team))
            .select({
                id: tTeams.teamId,
                roleId: tTeamsRoles.roleId,
            })
            .executeSelectNoneOrOne();

        if (!teamInfo)
            return { success: false, error: 'Unable to identify the appropriate team…' };

        const existingApplication = await dbInstance.selectFrom(tUsersEvents)
            .where(tUsersEvents.userId.equals(data.userId))
                .and(tUsersEvents.eventId.equals(eventId))
            .selectCountAll()
            .executeSelectNoneOrOne() ?? 0;

        if (existingApplication > 0)
            return { success: false, error: 'This volunteer already has an active application…' };

        const [ preferenceTimingStart, preferenceTimingEnd ] =
            data.serviceTiming.split('-').map(v => parseInt(v, 10));

        const affectedRows = await dbInstance.insertInto(tUsersEvents)
            .set({
                userId: data.userId,
                eventId: eventId,
                teamId: teamInfo.id,
                roleId: teamInfo.roleId,
                registrationDate: dbInstance.currentZonedDateTime(),
                registrationStatus: kRegistrationStatus.Registered,
                shirtFit: data.tshirtFit,
                shirtSize: data.tshirtSize,
                preferenceHours: parseInt(data.serviceHours, 10),
                preferenceTimingStart, preferenceTimingEnd,
                preferences: data.preferences,
                preferencesUpdated: dbInstance.currentZonedDateTime(),
                fullyAvailable: 1,
                includeCredits: 1,
                includeSocials: 1,
            })
            .executeInsert();

        if (!affectedRows)
            return { success: false, error: 'Unable to store the application in the database…' };

        RecordLog({
            type: kLogType.AdminEventApplication,
            severity: kLogSeverity.Warning,
            sourceUser: props.user,
            targetUser: data.userId,
            data: {
                event,
                team,
            }
        });

        return {
            success: true,
            refresh: true,
        };
    });
}

/**
 * Server action that should be called when an application should be moved to another team.
 */
export async function moveApplication(
    event: string, team: string, userId: number, formData: unknown)
{
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: {
                permission: 'event.applications',
                operation: 'update',
                scope: { event, team },
            },
        });

        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action that should be called when a previously rejected application should be reconsidered
 */
export async function reconsiderApplication(
    event: string, team: string, userId: number, formData: unknown)
{
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: {
                permission: 'event.applications',
                operation: 'create',
                scope: { event, team },
            },
        });

        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action that should be called when an application should be rejected.
 */
export async function rejectApplication(
    event: string, team: string, userId: number, formData: unknown)
{
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: {
                permission: 'event.applications',
                operation: 'update',
                scope: { event, team },
            },
        });

        return { success: false, error: 'Not yet implemented' };
    });
}
