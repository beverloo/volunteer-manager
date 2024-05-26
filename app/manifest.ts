// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { MetadataRoute } from 'next';

import { determineEnvironment } from '@lib/Environment';
import db, { tEvents } from '@lib/database';

/**
 * Generates the Web App Manifest file for the Volunteer Manager. We'll consider both the site's
 * environment and the upcoming event in determining what to generate.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
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

    return {
        name: event?.name || 'AnimeCon',
        short_name: event?.name || 'AnimeCon',
        description: `Volunteer Portal for ${event?.fullName || 'AnimeCon events'}`,
        start_url: '/?app',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: environment?.themeColours.light || '#303f9f',
        // TODO: icons
        // TODO: screenshots
        // TODO: shortcuts
    }
}
