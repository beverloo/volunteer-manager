// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Props accepted by the <Section> component.
 */
export interface SectionProps {
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
}

/**
 * The <Section> component represents a visually separated section of a page in the administration
 * area. The component is designed to be compatible with server-side rendering once the MUI library
 * supports this, and deliberately avoids the use of callbacks.
 *
 * Visually, a section consists of a header and associated content. The header contains a title, and
 * optionally a subtitle, a permission and an action. The content can be anything, which will be
 * displayed in a flexbox container that automatically adds spacing between the elements.
 *
 * While this component avoids the need for client-side JavaScript, actions can be passed that do
 * require them, to enable interaction such as a clear button.
 */
export function Section(props: React.PropsWithChildren<SectionProps>) {
    return (
        <Paper component={Stack} direction="column" spacing={2} sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: '-8px !important' }}>
                {props.title}
                { props.subtitle &&
                    <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                        ({props.subtitle})
                    </Typography> }
            </Typography>
            {props.children}
        </Paper>
    );
}
