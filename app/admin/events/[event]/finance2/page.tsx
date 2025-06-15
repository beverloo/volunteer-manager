// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextPageParams } from '@lib/NextRouterParams';
import { FinanceDashboard } from './FinanceDashboard';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';

/**
 * The <FinancePage> component represents the financial dashboard of a certain AnimeCon event. This
 * data is only accessible to a subset of our users, as it's not usually applicable.
 */
export default async function FinancePage(props: NextPageParams<'event'>) {
    const { event } = await verifyAccessAndFetchPageInfo(props.params, {
        permission: 'statistics.finances',
    });

    return (
        <>
            <Section title="Financial information" subtitle={event.shortName}>
                <SectionIntroduction>
                    This is the financial dashboard for {event.shortName}, showing key ticket sale
                    figures and comparisons with past editions.
                </SectionIntroduction>
            </Section>
            <FinanceDashboard event={event.slug} />
        </>
    );
}
