// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Card from '@mui/material/Card';

import { SubHeader } from './SubHeader';

/**
 * Props accepted by the <Section> component.
 */
interface SectionProps {
    /**
     * The header that should be shown above the section, if applicable.
     */
    header?: string;
}

/**
 * The <Section> component displays a card in the content section of the schedule app, optionally
 * supported by a <SubHeader> component to indicate what it's about.
 */
export function Section(props: React.PropsWithChildren<SectionProps>) {
    return (
        <>
            { !!props.header && <SubHeader>{props.header}</SubHeader> }
            <Card sx={{ mt: '8px !important' }}>
                {props.children}
            </Card>
        </>
    );
}
