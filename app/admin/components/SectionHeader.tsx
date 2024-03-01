// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography, { type TypographyProps } from '@mui/material/Typography';

/**
 * Props accepted by the <SectionHeader> component.
 */
export interface SectionHeaderProps {
    /**
     * Title of this section. Required.
     */
    title: string;

    /**
     * Subtitle to contextualize the header, displayed immediately adjacent to the title. Optional.
     */
    subtitle?: string;

    // TODO: Privilege
    // TODO: Action

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: TypographyProps['sx'],
}

/**
 * The <SectionHeader> component represents the heading part of a section, contextualizing what the
 * section is about, who can access it, and how it can be modified.
 *
 * While this component avoids the need for client-side JavaScript, actions can be passed that do
 * require them, to enable interaction such as a clear button.
 */
export function SectionHeader(props: SectionHeaderProps) {
    return (
        <Typography variant="h5" sx={{ mb: '-8px !important', ...props.sx }}>
            { props.title }
            { props.subtitle &&
                <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                    ({ props.subtitle })
                </Typography> }
        </Typography>
    );
}
