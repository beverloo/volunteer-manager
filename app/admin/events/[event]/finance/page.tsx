// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextPageParams } from '@lib/NextRouterParams';
import { SalesConfigurationSection } from './SalesConfigurationSection';
import { SalesUploadSection } from './SalesUploadSection';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { readUserSetting } from '@lib/UserSettings';

import { FinanceGraphGrid } from './FinanceGraphGrid';

/**
 * The <EventFinancePage> page displays financial information of the event to those who have access
 * to it. Financial administrators can further upload new information, and change configuration that
 * controls which metrics should be displayed in the different graphs.
 */
export default async function EventFinancePage(props: NextPageParams<'event'>) {
    const { access, event, user } = await verifyAccessAndFetchPageInfo(props.params, {
        permission: 'statistics.finances',
    });

    // Those who are allowed to manage an event's settings can manage financial information as well,
    // even though that does not necessarily mean that they can access the source data.
    const canManageFinances = access.can('event.settings', {
        event: event.slug,
    });

    let configurationExpanded = false;
    if (!!canManageFinances) {
        configurationExpanded =
            await readUserSetting(user.userId, 'user-admin-event-finance-configuration') ?? false;
    }

    return (
        <>
            <Section title="Financial information" subtitle={event.shortName}>
                <SectionIntroduction important>
                    Financial information regarding {event.shortName} is confidential, even within
                    the volunteering organisation. Do not share this information with anyone who
                    isn't AnimeCon Staff.
                </SectionIntroduction>
            </Section>
            <FinanceGraphGrid eventId={event.id} />
            { canManageFinances &&
                <SalesConfigurationSection event={event.slug} expanded={configurationExpanded} /> }
            { canManageFinances &&
                <SalesUploadSection event={event.slug} /> }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Financial information');
