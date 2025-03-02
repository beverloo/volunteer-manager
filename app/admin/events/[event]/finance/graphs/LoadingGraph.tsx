// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

/**
 * Props accepted by the <LoadingGraph> component.
 */
interface LoadingGraphProps {
    /**
     * Padding to apply to the loading graph. Defaults to none.
     */
    padding?: number;
}

/**
 * The <LoadingGraph> component displays a few lines indicating that a graph is currently still
 * being loaded. Each graph individually fetches data from the database, which may introduce a bit
 * of latency in the page loading completely.
 */
export function LoadingGraph(props: LoadingGraphProps) {
    return (
        <Box sx={{ p: props.padding ?? 0 }}>
            <Skeleton animation="wave" height={10} width="95%" />
            <Skeleton animation="wave" height={10} width="92%" />
            <Skeleton animation="wave" height={10} width="100%" />
            <Skeleton animation="wave" height={10} width="98%" />
        </Box>
    );
}
