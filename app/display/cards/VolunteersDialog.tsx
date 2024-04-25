// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import type { DisplayShiftInfo } from '../DisplayContext';

/**
 * Props accepted by the <VolunteersDialog> component.
 */
export interface VolunteersDialogProps {
    /**
     * Callback to call when the dialog should be closed.
     */
    onClose: () => void;

    /**
     * Whether the dialog should be opened.
     */
    open?: boolean;

    /**
     * Timezone in which any times should be displayed in the user interface.
     */
    timezone: string;

    /**
     * Volunteers that will be helping out in this location.
     */
    schedule: {
        past: DisplayShiftInfo[],
        active: DisplayShiftInfo[],
        future: DisplayShiftInfo[],
    },
}

/**
 * The <VolunteersDialog> component displays a sizeable dialog that provides access to the full
 * schedule of volunteers who are expected to help out at this location.
 */
export function VolunteersDialog(props: VolunteersDialogProps) {
    const { onClose, open, timezone, schedule } = props;

    return (
        <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>
                Schedule
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    TODO
                </DialogContentText>
            </DialogContent>
        </Dialog>
    );
}
