// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The Schedule page enables leads to build the comprehensive schedules defining where volunteers
 * will be helping out throughout the event. This is one of the most complex pages in our app, which
 * relies on the timeline component as well as data from many different sources.
 */
export default async function EventTeamSchedulePage(props: NextRouterParams<'slug' | 'team'>) {
    const { event, team } = await verifyAccessAndFetchPageInfo(props.params);

    return (
        <Section title="Schedule" subtitle={team.name}>
            <SectionIntroduction important>
                The schedule tool has not been implemented yet.
            </SectionIntroduction>
        </Section>
    );
}

export const generateMetadata = generateEventMetadataFn('Schedule');
