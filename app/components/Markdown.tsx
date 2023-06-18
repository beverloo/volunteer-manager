// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box, { BoxProps } from '@mui/material/Box';
import { MuiMarkdown } from 'mui-markdown';

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
            <MuiMarkdown>
                {children}
            </MuiMarkdown>
        </Box>
    );
}
