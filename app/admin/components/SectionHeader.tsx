// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Privilege } from '@lib/auth/Privileges';
import Stack from '@mui/material/Stack';
import Typography, { type TypographyProps } from '@mui/material/Typography';

/**
 * Props accepted by the <SectionHeader> component.
 */
export interface SectionHeaderProps {
    /**
     * Action that should be shown on the end side of the header.
     */
    action?: React.ReactNode;

    /**
     * The icon that should be shown in the section's header, if any.
     */
    icon?: React.ReactNode;

    /**
     * Privilege behind which availability of this section is gated, to inform the volunteer that
     * not everyone has access to this information.
     */
    privilege?: Privilege;

    /**
     * Title of this section. Required.
     */
    title: string;

    /**
     * Subtitle to contextualize the header, displayed immediately adjacent to the title. Optional.
     */
    subtitle?: string;

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
        <Stack direction="row" alignItems="center" justifyContent="space-between"
               sx={{ mb: '-8px !important', ...props.sx }}>
            <Stack direction="row" alignItems="center" spacing={1}>
                {props.icon}
                <Typography variant="h5">
                    { props.title }
                    { props.subtitle &&
                        <Typography component="span" variant="h5" color="action.active"
                                    sx={{ pl: 1 }}>
                            ({ props.subtitle })
                        </Typography> }
                </Typography>
            </Stack>
            {props.action}
        </Stack>
    );
}
