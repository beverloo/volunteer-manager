// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

/**
 * Props accepted by the <AdminHeaderPromoDialog> component.
 */
interface AdminHeaderPromoDialogProps {
    /**
     * Name of the volunteer as they should be addressed.
     */
    name: string;
}

/**
 * The <AdminHeaderPromoDialog> component displays a dialog, shown on page load, with a promotion
 * that reminds the administrator to fill in their example e-mail messages to train the AI.
 */
export function AdminHeaderPromoDialog(props: AdminHeaderPromoDialogProps) {
    const [ dialogOpen, setDialogOpen ] = useState<boolean>(true);

    const handleDialogClose = useCallback(() => setDialogOpen(false), [ /* no dependencies */ ]);

    return (
        <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth>
            <Box sx={{
                aspectRatio: 3.25,
                backgroundImage: 'url(/images/admin/ai-promo.jpg)',
                backgroundPosition: 'center center',

            }} />
            <DialogContent>
                <Typography sx={{ fontWeight: 600, mb: 2 }}>
                    Welcome, {props.name}!
                </Typography>
                <Typography sx={{ mb: 2 }}>
                    The AnimeCon Volunteer Manager is here to help you organise your teams in all
                    sorts of ways—often with a bit of AI magic! To make sure drafted messages sound
                    just like you do, we'll need a few email samples written in your own words.
                </Typography>
                <Typography>
                    When you have a moment, click on your avatar in this page's header to access
                    your account settings and get started.
                </Typography>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ pt: 1, mr: 2, mb: 0.5 }}>
                <Button onClick={handleDialogClose} variant="text">Close</Button>
            </DialogActions>
        </Dialog>
    );
}