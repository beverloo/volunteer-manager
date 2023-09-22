// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { MuiMarkdown, defaultOverrides } from 'mui-markdown';

import type { SxProps, Theme } from '@mui/system';
import Box, { type BoxProps } from '@mui/material/Box';
import { default as MuiLink, type LinkProps } from '@mui/material/Link';
import Typography, { type TypographyProps } from '@mui/material/Typography';
import { darken, lighten } from '@mui/material/styles';

import { RemoteContent } from './RemoteContent';

/**
 * Manual styles that apply to the <Markdown> client component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    root: {
        '&> div >:last-child': { mb: 0 },
        '&> p:last-child': { mb: 0 },

        '& blockquote': theme => {
            const backgroundColor =
                theme.palette.mode === 'light' ? lighten(theme.palette.error.main, .8)
                                               : darken(theme.palette.error.main, .7);

            return {
                backgroundColor,
                borderColor: 'transparent',
                borderRadius: `${theme.shape.borderRadius}px`,
                color: theme.palette.getContrastText(backgroundColor),

                margin: theme.spacing(2, 0),
                padding: theme.spacing(0, 2),

                '& p': {
                    padding: theme.spacing(1, 0),
                }
            };
        },

        '& p': { marginBottom: 2 },

        '& h5': { /* none yet */ },
        '& h6': { fontWeight: 800 },

        '& h2, h3': { marginBottom: 0 },

        '& h5 + p, h5 + ul': { marginTop: 0 },
        '& h6 + p, h6 + ul': { marginTop: 0 },

        '& li p': { margin: 0 },
    },
};

/**
 * Components for the different types of text that can be rendered as Markdown.
 */
function Text(props: TypographyProps & { tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' }) {
    switch (props.tag) {
        case 'h1':
        case 'h2':
            return <Typography {...props} variant="h5" />
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
            return <Typography {...props} variant="h6" />
    }

    return <Typography {...props} />
}

/**
 * Markdown replacement for both the native HTML <a> anchor element, as well as the Material UI
 * <Link> element, that employs NextJS routing.
 */
function LinkComponent(props: LinkProps & { children?: React.ReactNode }) {
    return <MuiLink component={Link} {...props} />;
}

/**
 * Properties accepted by the <Markdown> client-side component.
 */
export interface MarkdownProps extends BoxProps {
    /**
     * The content that should be displayed as the content of this component.
     */
    children?: string | null;
}

/**
 * The Markdown component converts the input, supporting Markdown, to a MUI-friendly React component
 * tree that can be used in the display of content.
 */
export function Markdown(props: MarkdownProps) {
    const { children, ...boxProps } = props;

    return (
        <Box {...boxProps}>
            <Box sx={kStyles.root}>
                <MuiMarkdown overrides={{
                    ...defaultOverrides,
                    a: { component: LinkComponent },
                    h1: { component: Text, props: { tag: 'h1' } },
                    h2: { component: Text, props: { tag: 'h2' } },
                    h3: { component: Text, props: { tag: 'h3' } },
                    h4: { component: Text, props: { tag: 'h4' } },
                    h5: { component: Text, props: { tag: 'h5' } },
                    h6: { component: Text, props: { tag: 'h6' } },
                    p: { component: Text, props: { tag: 'p' } },
                    RemoteContent: { component: RemoteContent } }}>
                    {children}
                </MuiMarkdown>
            </Box>
        </Box>
    );
}
