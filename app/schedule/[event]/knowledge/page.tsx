// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Section } from '../components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleKnowledgePage> component displays a list of categories available in the knowledge
 * base, each of which links through to a page containing all associated questions.
 */
export default async function ScheduleKnowledgePage(props: NextRouterParams<'event'>) {
    await requireAuthenticationContext({ check: 'event', event: props.params.event });
    return (
        <Section>
            <Typography variant="body1">
                This page is not available yet (/knowledge)
            </Typography>
        </Section>
    );
}
