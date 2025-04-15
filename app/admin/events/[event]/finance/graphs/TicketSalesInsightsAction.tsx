// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import React, { useCallback, useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InsightsIcon from '@mui/icons-material/Insights';
import Tooltip from '@mui/material/Tooltip';

/**
 * Props accepted by the <TicketSalesInsightsAction> component.
 */
interface TicketSalesInsightsActionProps {
    /**
     * Title of the graph, as should be displayed as the dialog's title.
     */
    title: string;
}

/**
 * The <TicketSalesInsightsAction> shows an action on the top-right corner of a ticket-related graph
 * for which we can provide AI-generated insights and projections.
 */
export function TicketSalesInsightsAction(props: TicketSalesInsightsActionProps) {
    const [ comparisonOpen, setComparisonOpen ] = useState<boolean>(false);

    const closeComparison = useCallback(() => setComparisonOpen(false), [ /* no deps */ ]);
    const openComparison = useCallback(() => setComparisonOpen(true), [ /* no deps */ ]);

    return (
        <>
            <Tooltip title="Insights">
                <IconButton onClick={openComparison}>
                    <InsightsIcon color="info" fontSize="small" />
                </IconButton>
            </Tooltip>
            { !!comparisonOpen &&
                <Dialog open={comparisonOpen} onClose={closeComparison} fullWidth maxWidth="md">
                    <DialogTitle>{props.title} — Insights</DialogTitle>
                    <DialogContent>
                        TODO: AI magic
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
