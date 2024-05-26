// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { MetadataRoute } from 'next';

import { Privilege, can } from '@lib/auth/Privileges';
import { determineEnvironment } from '@lib/Environment';
import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEvents } from '@lib/database';

/**
 * Generates the Web App Manifest file for the Volunteer Manager. We'll consider both the site's
 * environment and the upcoming event in determining what to generate.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const authenticationContext = await getAuthenticationContext();
    const environment = await determineEnvironment();

    const dbInstance = db;
    const event = await dbInstance.selectFrom(tEvents)
        .where(tEvents.eventHidden.equals(/* false= */ 0))
            .and(tEvents.eventEndTime.greaterOrEquals(dbInstance.currentZonedDateTime()))
        .select({
            name: tEvents.eventShortName,
            fullName: tEvents.eventName,
        })
        .limit(1)
        .executeSelectNoneOrOne();

    const administrationShortcut: MetadataRoute.Manifest['shortcuts'] = [];
    if (!!authenticationContext.user) {
        for (const event of authenticationContext.events.values()) {
            if (!event.admin)
                continue;  // the `user` does not have admin access to this event

            administrationShortcut.push({
                name: 'Administration',
                url: '/admin',
                icons: [
                    {
                        src: '/images/icon-admin.png',
                        sizes: '192x192',
                        type: 'image/png',
                    }
                ],
            });

            break;
        }
    }

    return {
        name: event?.name || 'AnimeCon',
        short_name: event?.name || 'AnimeCon',
        description: `Volunteer Portal for ${event?.fullName || 'AnimeCon events'}`,
        start_url: '/?app',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: environment?.themeColours.light || '#303f9f',
        icons: [
            {
                src: `/images/${environment?.environmentName}/logo-512.png`,
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: `/images/${environment?.environmentName}/logo-256.png`,
                sizes: '256x256',
                type: 'image/png',
            },
            {
                src: `/images/${environment?.environmentName}/logo-192.png`,
                sizes: '192x192',
                type: 'image/png',
            },
        ],
        screenshots: [
            {
                src: '/images/screenshot-1.png',
                sizes: '586x1041',
                type: 'image/png',
            },
            {
                src: '/images/screenshot-2.png',
                sizes: '586x1041',
                type: 'image/png',
            },
            {
                src: '/images/screenshot-3.png',
                sizes: '586x1041',
                type: 'image/png',
            },
        ],
        shortcuts: [
            ...administrationShortcut,
            {
                name: 'Registration',
                url: '/hello',
                icons: [
                    {
                        src: '/images/icon-registration.png',
                        sizes: '192x192',
                        type: 'image/png',
                    }
                ],
            }
        ],
    }
}
