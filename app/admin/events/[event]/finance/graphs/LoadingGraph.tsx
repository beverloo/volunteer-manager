// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

/**
 * The <LoadingGraph> component displays a few lines indicating that a graph is currently still
 * being loaded. Each graph individually fetches data from the database, which may introduce a bit
 * of latency in the page loading completely.
 */
export function LoadingGraph() {
    return (
        <Box sx={{ p: 0 }}>
            <Skeleton animation="wave" height={10} width="95%" />
            <Skeleton animation="wave" height={10} width="92%" />
            <Skeleton animation="wave" height={10} width="100%" />
            <Skeleton animation="wave" height={10} width="98%" />
        </Box>
    );
}
