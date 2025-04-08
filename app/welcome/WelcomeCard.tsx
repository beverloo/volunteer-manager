// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { deepmerge } from '@mui/utils';

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
 * Props accepted by the <WelcomeCard> component.
 */
interface WelcomeCardProps {
    /**
     * Description of the team that should be prominently displayed. May contain Markdown.
     */
    description: string;

    /**
     * Style to inject in the landing image component, which depends on the current environment.
     */
    landingStyle: SxProps<Theme>;
}

/**
 * Card that displays the main card on our landing page. It's mostly a layout card, displays the
 * description of the team the visitor might be interested in participating in, but falls through
 * back to server-controlled data for its children which are the primary CTA buttons.
 */
export function WelcomeCard(props: React.PropsWithChildren<WelcomeCardProps>) {
    const { description, landingStyle } = props;

    return (
        <Grid container spacing={2} alignItems="center" sx={kStyles.landingPage}>
            <Grid size={{ xs: 12, md: 5 }}>
                <Markdown sx={{ pt: 1, px: 2 }}>
                    {description}
                </Markdown>
                <Stack direction="column" spacing={2} sx={{ p: 2, mt: 1 }}>
                    {props.children}
                </Stack>
            </Grid>
            <Grid size={{ xs: 0, md: 7 }} sx={deepmerge(kStyles.photoInline, landingStyle)}>
                { /* TODO: Multiple photos per environment */ }
            </Grid>
        </Grid>
    );
}
