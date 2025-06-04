// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Collapse from '@mui/material/Collapse';
import Grid, { type GridProps } from '@mui/material/Grid';

/**
 * Props accepted by the <CollapsableGrid> component.
 */
interface CollapsableGridProps extends GridProps {
    /**
     * Whether the Grid should be shown. Slightly unintuitive meaning that matches the behaviour of
     * MUI's <Collapse> element, where `true` means expanded.
     */
    in?: boolean;
}

/**
 * The <CollapsableGrid> component is a regular non-container <Grid> component with an additional
 * `in` prop that allows it to be collapsed through an animation.
 */
export function CollapsableGrid(props: CollapsableGridProps) {
    const { children, in: expanded, ...gridProps } = props;

    return (
        <Collapse in={expanded} mountOnEnter unmountOnExit sx={{ width: '100%' }}>
            <Grid {...gridProps}>
                {children}
            </Grid>
        </Collapse>
    );
}
