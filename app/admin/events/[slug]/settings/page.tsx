// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';

import type { NextPageParams } from '@lib/NextRouterParams';
import { EventDates } from './EventDates';
import { EventDeadlinesTable } from './EventDeadlinesTable';
import { EventSales } from './EventSales';
import { EventSettings } from './EventSettings';
import { EventTeamsTable } from './EventTeamsTable';
import { Privilege, can } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { SettingsHeader } from './SettingsHeader';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { getLeadersForEvent } from '@app/admin/lib/getLeadersForEvent';

/**
 * The <EventSettingsPage> page allows event administrators to make changes to an event, such as its
 * name, slug, target team sizes and so on. These have an effect on the entire Volunteer Manager.
 */
export default async function EventSettingsPage(props: NextPageParams<'slug'>) {
    const { event, user } = await verifyAccessAndFetchPageInfo(
        props.params, Privilege.EventAdministrator);

    const isAdministrator = can(user, Privilege.Administrator);
    const leaders = await getLeadersForEvent(event.id);

    const link = 'https://www.yourticketprovider.nl/account/events/manage/myevents.aspx';

    return (
        <>
            <SettingsHeader event={event} />
            <Section title="Configuration">
                <EventSettings event={event} />
            </Section>
            <EventDates />
            <Section title="Deadlines">
                <EventDeadlinesTable event={event} leaders={leaders} />
            </Section>
            <Section title="Team settings">
                <EventTeamsTable event={event} />
            </Section>
            { !!isAdministrator &&
                <Section title="Sales import">
                    <SectionIntroduction>
                        Aggregated information can be imported from our{' '}
                        <MuiLink component={Link} href={link}>ticketing partner</MuiLink>:
                        navigate to an event, then <em>Rapports</em>, then <em>Sales</em>, then
                        download the daily statistics per ticket type.
                    </SectionIntroduction>
                    <EventSales event={event} />
                </Section> }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Settings');
