// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LoadingButton from '@mui/lab/LoadingButton';
import Typography from '@mui/material/Typography';

/**
 * Types of content that can be rendered in the <ConfirmationDialog> slots.
 */
type Content = string | React.ReactNode | React.ReactNode[];

/**
 * Props accepted by the <ConfirmationDialog> component.
 */
export interface ConfirmationDialogProps {
    /**
     * Label to display on the close button. Defaults to "Close".
     */
    closeLabel?: string;

    /**
     * Label to display on the confirm button. Defaults to "Confirm".
     */
    confirmLabel?: string;

    /**
     * Description of the dialog. May either be a string or a ReactNode. Optional.
     */
    description?: Content;

    /**
     * To be called when the dialog is supposed to close. The `reason` indicates why the dialog has
     * been closed, in case behaviour should depend on those options.
     */
    onClose?: (reason?: 'backdropClick' | 'button' | 'escapeKeyDown') => Promise<void> | void;

    /**
     * To be called when the action described in this dialog has been confirmed. The handler
     * should throw an exception when an error occurs, or populate either (but not both) of the
     * response values.
     */
    onConfirm?: () => Promise<{ success: Content } | { error: Content }>;

    /**
     * Whether the dialog should be open.
     */
    open?: boolean;

    /**
     * Title of the dialog that should be displayed.
     */
    title: Content;
}

/**
 * The <ConfirmationDialog> component encapsulates a canonical dialog through which an action can
 * be confirmed, which can be important to avoid people from accidentally deleting things.
 */
export function ConfirmationDialog(props: React.PropsWithChildren<ConfirmationDialogProps>) {
    const { children, description, onClose, onConfirm, open, title } = props;

    const closeLabel = props.closeLabel ?? 'Close';
    const confirmLabel = props.confirmLabel ?? 'Confirm';

    // ---------------------------------------------------------------------------------------------
    // Internal handling for user interactions within the dialog.
    // ---------------------------------------------------------------------------------------------
    const [ errorMessage, setErrorMessage ] = useState<Content>();
    const [ successMessage, setSuccessMessage ] = useState<Content>();

    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleClose = useCallback(async (
        event: unknown, reason?: 'backdropClick' | 'escapeKeyDown') =>
    {
        try {
            if (onClose)
                await onClose(reason ?? 'button');
        } finally {
            setErrorMessage(undefined);
            setSuccessMessage(undefined);
            setInvalidated(false);
            setLoading(false);
        }
    }, [ onClose ]);

    const handleConfirm = useCallback(async () => {
        setErrorMessage(undefined);
        setSuccessMessage(undefined);
        setInvalidated(true);
        setLoading(true);
        try {
            if (onConfirm) {
                const result = await onConfirm();
                if ('error' in result)
                    setErrorMessage(result.error);
                else
                    setSuccessMessage(result.success);
            }
        } catch (error: any) {
            setErrorMessage(error.message ?? 'An unknown error occurred.');
            console.error('Unable to submit a <ConfirmationDialog>:', error);
        } finally {
            setLoading(false);
        }
    }, [ onConfirm ]);

    // ---------------------------------------------------------------------------------------------
    // The actual React component.
    // ---------------------------------------------------------------------------------------------
    return (
        <Dialog open={!!open} onClose={handleClose} fullWidth>
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent>
                { description &&
                    <Typography>
                        {description}
                    </Typography> }
                {children}
                <Collapse in={!!successMessage}>
                    <Alert severity="success" sx={{ mt: 2 }}>
                        {successMessage}
                    </Alert>
                </Collapse>
                <Collapse in={!!errorMessage}>
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {errorMessage}
                    </Alert>
                </Collapse>
            </DialogContent>
            <DialogActions sx={{ pt: 0, mr: 2, mb: 2 }}>
                <Button onClick={handleClose} variant="text">{closeLabel}</Button>
                <LoadingButton disabled={!!successMessage} loading={loading} onClick={handleConfirm}
                               variant="contained">
                    {confirmLabel}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}
