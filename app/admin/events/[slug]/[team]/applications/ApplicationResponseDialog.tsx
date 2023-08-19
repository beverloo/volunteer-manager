// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

/**
 * Props accepted by the <ApplicationResponseDialog> component.
 */
export interface ApplicationResponseDialogProps {
    /**
     * Whether the represented application should be approved or rejected.
     */
    action?: 'approve' | 'reject';

    /**
     * Information about the application that this dialog is created for.
     */
    application?: {
        /**
         * First name of the applicant for whom we are making a decision.
         */
        firstName: string;

        userId: number;
        eventId: number;
        teamId: number;
    };

    /**
     * To be called when the dialog should be closed.
     */
    onClose: () => void;

    /**
     * Whether the dialog should be opened.
     */
    open?: boolean;
}

/**
 * The <ApplicationResponseDialog> component represents a dialog that can be used to approve or
 * reject applications. The necessary information will be fetched from the server.
 */
export function ApplicationResponseDialog(props: ApplicationResponseDialogProps) {
    const { action, application, onClose, open } = props;

    return (
        <Dialog onClose={onClose} open={!!open} fullWidth>
            <DialogTitle>
                { action === 'approve' && `Approve ${application?.firstName}'s application?`}
                { action === 'reject' && `Reject ${application?.firstName}'s application?`}
            </DialogTitle>
            <DialogContent>
                TODO
            </DialogContent>
            <DialogActions>
                TODO
            </DialogActions>
        </Dialog>
    );
}
