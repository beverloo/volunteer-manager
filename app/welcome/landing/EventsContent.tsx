// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { deepmerge } from '@mui/utils';

import type { Environment } from '@lib/Environment';
import type { EnvironmentContextEventAccess } from '@lib/EnvironmentContext';
import { Markdown } from '@components/Markdown';

/**
 * Manual styles that apply to the <WelcomeCard> client component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    landingPage: {
        minHeight: { md: 340 },
        mt: 0,
        mr: '-0.5px' /* ... */
    },

    photoInline: {
        display: { xs: 'none', md: 'block' },
        position: 'relative',

        backgroundPosition: 'top left',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        borderBottomRightRadius: 4,
        alignSelf: 'stretch',
    },
};

/**
 * Props accepted by the <EventsContent> component.
 */
interface EventsContentProps {
    /**
     * The environment for which the landing page is being shown.
     */
    environment: Environment;

    /**
     * The events that should be shown on this page. At most two events will be included.
     */
    events: EnvironmentContextEventAccess[];
}

/**
 * The <EventsContent> component represents the case when the visitor has access to one or more
 * events, which should show clear call-to-actions for the visitor to access or participate in.
 */
export function EventsContent(props: EventsContentProps) {
    const photoStyle = deepmerge(kStyles.photoInline, {
        // TODO: Support multiple photos per environment, and rotate them periodically
        backgroundImage: `url('/images/${props.environment.domain}/landing.jpg')`,
    });

    // TODO: CTA buttons

    return (
        <Grid container spacing={2} alignItems="center" sx={kStyles.landingPage}>
            <Grid size={{ xs: 12, md: 5 }}>
                <Markdown sx={{ pt: 1, px: 2 }}>
                    {props.environment.description}
                </Markdown>
                <Stack direction="column" spacing={2} sx={{ p: 2, mt: 1 }}>
                    { /* TODO: Determine the buttons */ }
                </Stack>
            </Grid>
            <Grid size={{ xs: 0, md: 7 }} sx={photoStyle} />
        </Grid>
    );
}
