// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import React, { useCallback, useState } from 'react';

import BarChartIcon from '@mui/icons-material/BarChart';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

/**
 * Props accepted by the <TicketSalesGrowthComparisonAction> component.
 */
interface TicketSalesGrowthComparisonActionProps {
    /**
     * The graph node that should be displayed once activated.
     */
    graph: React.ReactNode;

    /**
     * Title of the graph, as should be displayed as the dialog's title.
     */
    title: string;
}

/**
 * The <TicketSalesGrowthComparisonAction> shows an action on the top-right corner of a regular
 * graph that can be used to visualise sales/week over a certain amount of time.
 */
export function TicketSalesGrowthComparisonAction(props: TicketSalesGrowthComparisonActionProps) {
    const { graph, title } = props;

    const [ comparisonOpen, setComparisonOpen ] = useState<boolean>(false);

    const closeComparison = useCallback(() => setComparisonOpen(false), [ /* no deps */ ]);
    const openComparison = useCallback(() => setComparisonOpen(true), [ /* no deps */ ]);

    return (
        <>
            <Tooltip title="Y/Y Daily Sales">
                <IconButton onClick={openComparison}>
                    <BarChartIcon color="info" fontSize="small" />
                </IconButton>
            </Tooltip>
            { !!comparisonOpen &&
                <Dialog open={comparisonOpen} onClose={closeComparison} fullWidth maxWidth="md">
                    <DialogTitle>
                        {title} — Y/Y Daily Sales
                    </DialogTitle>
                    <DialogContent>
                        {graph}
                    </DialogContent>
                    <DialogActions sx={{ pt: 1, mr: 1, mb: 0 }}>
                        <Button onClick={closeComparison} variant="text">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog> }
        </>
    );
}
