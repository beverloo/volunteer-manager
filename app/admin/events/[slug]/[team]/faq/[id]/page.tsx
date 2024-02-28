// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { generateEventMetadataFn } from '../../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * This page displays an individual FAQ entry, which allows the volunteer to change both the
 * question and the answer to the question. A rich text editing component is made available.
 */
export default async function EventTeamFaqEntryPage(props: NextRouterParams<'slug' | 'team'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);
    if (!team.managesFaq)
        notFound();

    return (
        <Section title="Knowledge base" subtitle={event.shortName}>
            <SectionIntroduction important>
                The question page has not been implemented yet.
            </SectionIntroduction>
        </Section>
    );
}

export const generateMetadata = generateEventMetadataFn('Knowledge base');
