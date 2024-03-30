// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper from '@mui/material/Paper';

/**
 * Props accepted by the <Section> component.
 */
export interface SectionProps {
    // TODO
}

/**
 * The <Section> component displays a card in the content section of the schedule app.
 */
export function Section(props: React.PropsWithChildren<SectionProps>) {
    return (
        <Paper sx={{ mt: 2, p: 2 }}>
            { props.children }
        </Paper>
    );
}
