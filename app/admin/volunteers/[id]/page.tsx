// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { NextPageParams } from '@lib/NextRouterParams';
import type { Temporal } from '@lib/Temporal';
import { Header } from './Header';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

import db, { tUsers } from '@lib/database';

/**
 * Information about the volunteer for whom this page is being displayed.
 */
export interface VolunteerInfo {
    /**
     * Information about the volunteer's account.
     */
    account: {
        userId: number;
        username?: string;
        firstName: string;
        lastName: string;
        displayName?: string;
        gender: string;
        birthdate?: string;  // YYYY-MM-DD
        phoneNumber?: string;
        discordHandle?: string;
        discordHandleUpdated?: Temporal.ZonedDateTime;
        activated: number;
    };
}

/**
 * Fetches information about the volunteer identified by the given `unverifiedId` from the database.
 */
async function fetchVolunteerInfo(unverifiedId: string): Promise<VolunteerInfo | undefined> {
    const numericUnverifiedId = parseInt(unverifiedId, 10);
    if (isNaN(numericUnverifiedId))
        return undefined;

    const dbInstance = db;
    const account = await dbInstance.selectFrom(tUsers)
        .where(tUsers.userId.equals(numericUnverifiedId))
        .select({
            userId: tUsers.userId,
            username: tUsers.username,
            firstName: tUsers.firstName,
            lastName: tUsers.lastName,
            displayName: tUsers.displayName,
            gender: tUsers.gender,
            birthdate: dbInstance.dateAsString(tUsers.birthdate),
            phoneNumber: tUsers.phoneNumber,
            discordHandle: tUsers.discordHandle,
            discordHandleUpdated: tUsers.discordHandleUpdated,
            activated: tUsers.activated,
        })
        .executeSelectNoneOrOne();

    if (!account)
        notFound();

    return { account };
}

/**
 * Displays information about an individual volunteer, uniquely identified by their ID. Data will
 * be fetched from the database prior to being displayed.
 */
export default async function VolunteerPage(props: NextPageParams<'id'>) {
    const { access } = await requireAuthenticationContext({
        check: 'admin',
        permission: {
            permission: 'volunteer.account.information',
            operation: 'read',
        },
    });

    const params = await props.params;

    const volunteerInfo = await fetchVolunteerInfo(params.id);
    if (!volunteerInfo)
        notFound();

    const { account } = volunteerInfo;

    const canImpersonate = access.can('organisation.impersonation');

    return (
        <>
            <Header account={account} canImpersonate={canImpersonate} />
        </>
    );
}

/**
 * Dynamically generates metadata for this request by fetching the volunteer's real name from the
 * database, and using this as the page title. MysQL connections are pooled.
 */
export async function generateMetadata(props: NextPageParams<'id'>): Promise<Metadata> {
    const userId = parseInt((await props.params).id, 10);
    if (isNaN(userId))
        return { /* no updates */ };

    const user = await db.selectFrom(tUsers)
        .where(tUsers.userId.equals(userId))
        .select({ name: tUsers.name })
        .executeSelectNoneOrOne();

    if (user)
        return { title: `${user.name} | AnimeCon Volunteer Manager` };

    return { /* no updates */ };
}
