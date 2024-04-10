// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

/**
 * Props accepted by the <CalendarPopover> component.
 */
export interface CalendarPopoverProps {
    /**
     * Whether the calendar should be opened.
     */
    open?: boolean;

    /**
     * Title that should be shown on the popover.
     */
    title: string;

    /**
     * Called when the calendar should be closed.
     */
    onClose?: () => void;
}

/**
 * The <CalendarPopover> component displays a popover element containing a calendar.
 */
export function CalendarPopover(props: CalendarPopoverProps) {
    const { open, onClose, title } = props;

    const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down('md'));

    return (
        <Dialog open={!!open} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="md">
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <DialogTitle>
                    {title}
                </DialogTitle>
                <Box sx={{ pr: 2 }}>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Stack>
            <Typography sx={{ color: 'text.disabled', px: 3, pb: 3 }}>
                { /* TODO: Show a calendar component */ }
                Calendar coming soon
            </Typography>
        </Dialog>
    );
}
