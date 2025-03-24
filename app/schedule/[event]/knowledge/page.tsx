// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import type { NextPageParams } from '@lib/NextRouterParams';
import { HeaderSectionCard } from '../components/HeaderSectionCard';
import { KnowledgeBaseCategories } from './KnowledgeBaseCategories';
import { generateScheduleMetadataFn } from '../lib/generateScheduleMetadataFn';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleKnowledgePage> component displays a list of categories available in the knowledge
 * base, each of which links through to a page containing all associated questions.
 */
export default async function ScheduleKnowledgePage(props: NextPageParams<'event'>) {
    await requireAuthenticationContext({ check: 'event', event: (await props.params).event });
    return (
        <>
            <HeaderSectionCard>
                <Box sx={{
                    backgroundImage: 'url(/images/knowledge-base.jpg)',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    width: '100%',
                    aspectRatio: 4 }} />
            </HeaderSectionCard>
            <KnowledgeBaseCategories />
        </>
    );
}

export const generateMetadata = generateScheduleMetadataFn([ 'Knowledge Base' ]);
