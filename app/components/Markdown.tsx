// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link, { type LinkProps } from 'next/link';
import { MuiMarkdown, defaultOverrides } from 'mui-markdown';

import Box, { BoxProps } from '@mui/material/Box';

/**
 * Markdown replacement for both the native HTML <a> anchor element, as well as the Material UI
 * <Link> element, that (1) employs NextJS routing and (2) enables resolution using a `baseUrl`.
 */
function LinkComponent(props: LinkProps & { baseUrl?: string, children?: React.ReactNode }) {
    if (typeof props.href === 'string' && typeof document !== 'undefined' && props.baseUrl) {
        const resolvedUrl = new URL(props.href, document.location.origin + props.baseUrl);
        const resolvedHref = resolvedUrl.toString();

        return <Link href={resolvedHref}>{props.children}</Link>;
    }

    return <Link {...props} />;
}

/**
 * Properties accepted by the <Markdown> client-side component.
 */
export interface MarkdownProps extends BoxProps {
    /**
     * Base URL for relative links contained on this page.
     */
    baseUrl?: string;

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
    const { baseUrl, children, ...boxProps } = props;

    return (
        <Box {...boxProps}>
            <MuiMarkdown overrides={{
                ...defaultOverrides,
                a: { component: LinkComponent, props: { baseUrl } } }}>
                {children}
            </MuiMarkdown>
        </Box>
    );
}
