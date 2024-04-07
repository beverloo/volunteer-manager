// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

/**
 * Props accepted by the <EventSales> component.
 */
export interface EventSalesProps {
    /**
     * Unique slug of the event for which sales information should be shown.
     */
    event: string;
}

/**
 * The <EventSales> component displays a graph of the event's ticket sales relative to previous
 * years. It's only available to event administrators, which generally maps to Staff level.
 */
export async function EventSales(props: EventSalesProps) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                Graph coming soon…
            </Typography>
        </Box>
    );
}

/**
 * The <EventSalesLoading> component is shown instead of the <EventSales> component while it is
 * still loading.
 */
export function EventSalesLoading() {
    return (
        <Box sx={{ p: 2 }}>
            <Skeleton animation="wave" height={10} width="95%" />
            <Skeleton animation="wave" height={10} width="92%" />
            <Skeleton animation="wave" height={10} width="100%" />
            <Skeleton animation="wave" height={10} width="98%" />
        </Box>
    );
}

