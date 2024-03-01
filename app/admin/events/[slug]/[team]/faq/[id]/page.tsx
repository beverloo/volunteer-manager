// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { ContentEditor } from '@app/admin/content/ContentEditor';
import { SectionHeader } from '@app/admin/components/SectionHeader';
import { createKnowledgeBaseScope } from '@app/admin/content/ContentScope';
import { generateEventMetadataFn } from '../../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * This page displays an individual FAQ entry, which allows the volunteer to change both the
 * question and the answer to the question. A rich text editing component is made available.
 */
export default async function EventFaqEntryPage(props: NextRouterParams<'slug' | 'team' | 'id'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);
    if (!team.managesFaq)
        notFound();

    const scope = createKnowledgeBaseScope(event.id);

    return (
        <ContentEditor contentId={parseInt(props.params.id)} pathHidden scope={scope}>
            <SectionHeader title="Knowledge base" subtitle={event.shortName} sx={{ mb: 1 }} />
        </ContentEditor>
    );
}

export const generateMetadata = generateEventMetadataFn('Knowledge base');
