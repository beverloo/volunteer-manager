// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRouterParams } from '@lib/NextRouterParams';
import { EventDeadlinesTable } from './EventDeadlinesTable';
import { EventSettings } from './EventSettings';
import { EventTeamsTable } from './EventTeamsTable';
import { Privilege } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { SettingsHeader } from './SettingsHeader';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { getLeadersForEvent } from '@app/admin/lib/getLeadersForEvent';

/**
 * The <EventSettingsPage> page allows event administrators to make changes to an event, such as its
 * name, slug, target team sizes and so on. These have an effect on the entire Volunteer Manager.
 */
export default async function EventSettingsPage(props: NextRouterParams<'slug'>) {
    const { event } = await verifyAccessAndFetchPageInfo(
        props.params, Privilege.EventAdministrator);

    const leaders = await getLeadersForEvent(event.id);

    return (
        <>
            <SettingsHeader event={event} />
            <Section title="Configuration">
                <EventSettings event={event} />
            </Section>
            <Section title="Deadlines">
                <EventDeadlinesTable event={event} leaders={leaders} />
            </Section>
            <Section title="Team settings">
                <EventTeamsTable event={event} />
            </Section>
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Settings');
