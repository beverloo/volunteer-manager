// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Header } from './Header';
import { Information } from './Information';
import { Logs } from './Logs';
import { type ParticipationInfo, Participation } from './Participation';
import { Permissions } from './Permissions';
import { Privilege, can } from '@app/lib/auth/Privileges';
import { type LogMessage, fetchLogs } from '@app/lib/LogLoader';
import { requireUser } from '@lib/auth/getUser';
import { sql } from '@lib/database';

/**
 * Information about the volunteer for whom this page is being displayed.
 */
export interface VolunteerInfo {
    /**
     * Information about the volunteer's account.
     */
    account: {
        userId: number;
        username?: string | null;
        firstName: string;
        lastName: string;
        gender: string;
        birthdate?: string | null;
        phoneNumber?: string | null;
        privileges: number;
        activated: boolean;
    };

    /**
     * Log messages about or issued by this user. Limited to 100 messages.
     */
    logs: LogMessage[];

    /**
     * Information about the volunteer's participation across AnimeCon events.
     */
    participation: ParticipationInfo[];
}

/**
 * Fetches information about the volunteer identified by the given `unverifiedId` from the database.
 */
async function fetchVolunteerInfo(unverifiedId: string): Promise<VolunteerInfo | undefined> {
    const [ account, logs, participation ] = await Promise.all([
        // -----------------------------------------------------------------------------------------
        // Account
        // -----------------------------------------------------------------------------------------
        sql`SELECT
                users.user_id AS userId,
                users.username,
                users.first_name AS firstName,
                users.last_name AS lastName,
                users.gender,
                users.birthdate,
                users.phone_number AS phoneNumber,
                privileges,
                activated
            FROM
                users
            WHERE
                users.user_id = ${unverifiedId}`,

        // -----------------------------------------------------------------------------------------
        // Logs
        // -----------------------------------------------------------------------------------------
        fetchLogs({ sourceOrTargetUserId: parseInt(unverifiedId, 10) }),

        // -----------------------------------------------------------------------------------------
        // Participation
        // -----------------------------------------------------------------------------------------
        sql`SELECT
                (1000 * users_events.event_id + users_events.team_id) AS id,
                events.event_short_name AS event,
                events.event_slug AS eventSlug,
                users_events.registration_status AS status,
                teams.team_name AS team,
                roles.role_name AS role
            FROM
                users_events
            LEFT JOIN
                events ON events.event_id = users_events.event_id
            LEFT JOIN
                teams ON teams.team_id = users_events.team_id
            LEFT JOIN
                roles ON roles.role_id = users_events.role_id
            WHERE
                users_events.user_id = ${unverifiedId}
            ORDER BY
                events.event_start_time DESC`
    ]);

    if (!account.ok || !account.rows.length)
        notFound();
    if (!participation.ok)
        notFound();

    return {
        account: account.rowsPod[0] as VolunteerInfo['account'],
        logs,
        participation: participation.rowsPod as ParticipationInfo[],
    };
}

/**
 * Displays information about an individual volunteer, uniquely identified by their ID. Data will
 * be fetched from the database prior to being displayed.
 */
export default async function VolunteerPage(props: NextRouterParams<'id'>) {
    const user = await requireUser();
    if (!can(user, Privilege.AccessVolunteers))
        notFound();

    const volunteerInfo = await fetchVolunteerInfo(props.params.id);
    if (!volunteerInfo)
        notFound();

    const { account, logs, participation } = volunteerInfo;

    const isAdmin = can(user, Privilege.Administrator);

    return (
        <>
            <Header account={account} isAdmin={isAdmin} />
            <Information account={account} />
            <Participation participation={participation} userId={account.userId} />

            { (can(user, Privilege.Administrator) && logs.length > 0) && <Logs messages={logs} /> }
            { (can(user, Privilege.Administrator)) &&
                <Permissions userId={account.userId} privileges={account.privileges} /> }
        </>
    );
}

/**
 * Dynamically generates metadata for this request by fetching the volunteer's real name from the
 * database, and using this as the page title. MysQL connections are pooled.
 */
export async function generateMetadata(props: NextRouterParams<'id'>): Promise<Metadata> {
    const result = await sql`
        SELECT
            CONCAT(users.first_name, " ", users.last_name) AS name
        FROM
            users
        WHERE
            users.user_id = ${props.params.id}`;

    if (result.ok && result.rows.length >= 1)
        return { title: `${result.rows[0].name} | AnimeCon Volunteer Manager` };

    return { /* no updates */ };
}
