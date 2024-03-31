// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Section } from '../../components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleKnowledgeCategoryPage> component displays a list of all questions within a given
 * category of the knowledge base. All questions will be alphabetically listed on this page.
 */
export default async function ScheduleKnowledgeCategoryPage(
    props: NextRouterParams<'category' | 'event'>)
{
    await requireAuthenticationContext({ check: 'event', event: props.params.event });
    return (
        <Section>
            <Typography variant="body1">
                This page is not available yet (/knowledge/:category)
            </Typography>
        </Section>
    );
}
