// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import type { ValueOptions } from '@mui/x-data-grid-pro';

import type { DisplayTableEventOption, DisplayTableLocationOption } from './DisplaysTable';
import { DisplaysTable } from './DisplaysTable';
import { Privilege } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tActivitiesLocations } from '@lib/database';

/**
 * The <DisplaysPage> component hosts a data table that shows the physical displays that have
 * recently checked in, and allows them to be provisioned and configured.
 */
export default async function DisplaysPage() {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemDisplayAccess,
    });

    const events: DisplayTableEventOption[] = await db.selectFrom(tEvents)
        .where(tEvents.eventFestivalId.isNotNull())
        .select({
            value: tEvents.eventId,
            label: tEvents.eventShortName,
        })
        .orderBy(tEvents.eventStartTime, 'desc')
        .executeSelectMany();

    const locations: DisplayTableLocationOption[] = await db.selectFrom(tActivitiesLocations)
        .innerJoin(tEvents)
            .on(tEvents.eventFestivalId.equals(tActivitiesLocations.locationFestivalId))
        .where(tActivitiesLocations.locationDeleted.isNull())
        .select({
            value: tActivitiesLocations.locationId,
            label: tActivitiesLocations.locationDisplayName.valueWhenNull(
                tActivitiesLocations.locationName),

            // Used for filtering the available locations:
            eventId: tEvents.eventId,
        })
        .orderBy('label', 'asc')
        .executeSelectMany();

    return (
        <Section title="Display configuration">
            <SectionIntroduction>
                We distribute <strong>physical displays</strong> during the festival to help busy
                areas self-manage their volunteers. They automatically register with the Volunteer
                Manager, and can be provisioned and controlled through this interface. Updates can
                take up to five minutes to propagate.
            </SectionIntroduction>
            <DisplaysTable events={events} locations={locations} />
        </Section>
    );
}

export const metadata: Metadata = {
    title: 'Displays | AnimeCon Volunteer Manager',
};
