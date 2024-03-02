// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Collapse from '@mui/material/Collapse';

import { Section, type SectionProps } from './Section';

/**
 * Props accepted by the <CollapsableSection> component, that are directly owned by the component.
 */
export type CollapsableSectionProps = SectionProps & {
    /**
     * Whether the section should be transitioned in.
     */
    in?: boolean;
}

/**
 * The <CollapsableSection> component represents a visually separated section of a page in the
 * administration area that, unlike <Section>, can be hidden and shown dynamically. The component
 * is designed to be compatible with server-side rendering.
 */
export function CollapsableSection(props: React.PropsWithChildren<CollapsableSectionProps>) {
    const { in: transitionedIn, ...sectionProps } = props;

    return (
        <Collapse in={transitionedIn} sx={{ '&.MuiCollapse-hidden': { marginBottom: -2 } }}>
            <Section {...sectionProps} />
        </Collapse>
    );
}
