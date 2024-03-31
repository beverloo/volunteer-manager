// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Header } from '../components/Header';
import { KnowledgeBaseCategories } from './KnowledgeBaseCategories';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleKnowledgePage> component displays a list of categories available in the knowledge
 * base, each of which links through to a page containing all associated questions.
 */
export default async function ScheduleKnowledgePage(props: NextRouterParams<'event'>) {
    await requireAuthenticationContext({ check: 'event', event: props.params.event });
    return (
        <>
            <Header title="Knowledge base" />
            <KnowledgeBaseCategories />
        </>
    );
}
