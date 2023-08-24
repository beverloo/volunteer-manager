// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import { type FieldValues, type FormContainerProps, FormContainer, useForm }
    from 'react-hook-form-mui';

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
 * Props accepted by the <SettingDialog> component. May optionally be typed by TFieldValues, which
 * will propagate to the form container and settings contained herein.
 */
export interface SettingDialogProps<TFieldValues extends FieldValues = FieldValues> {
    /**
     * Label to display on the close button. Defaults to "Close".
     */
    closeLabel?: string;

    /**
     * Default values to prepopulate in the dialog. Optional.
     */
    defaultValues?: FormContainerProps<TFieldValues>['defaultValues'];

    /**
     * Description of the dialog. May either be a string or a ReactNode. Optional.
     */
    description?: string | React.ReactNode;

    /**
     * To be called when the dialog is supposed to close. The `reason` indicates why the dialog has
     * been closed, in case behaviour should depend on those options.
     */
    onClose?: (reason?: 'backdropClick' | 'button' | 'escapeKeyDown') => Promise<void> | void;

    /**
     * To be called when the form in the dialog is being submitted. The `data` contains the values
     * of the form values contained within the dialog. The handler should throw an exception when
     * an error occurs, or populate either (but not both) of the response values.
     */
    onSubmit?: (data: TFieldValues) => Promise<{ success: string } | { error: string }>;

    /**
     * Whether the dialog should be open.
     */
    open?: boolean;

    /**
     * Label to display on the submit button. Defaults to "Update".
     */
    submitLabel?: string;

    /**
     * Title of the dialog that should be displayed.
     */
    title: string | React.ReactNode;
}

/**
 * The <SettingDialog> component encapsulates a canonical dialog through which settings can be
 * changed. It supports
 */
export function SettingDialog<TFieldValues extends FieldValues = FieldValues>(
    props: React.PropsWithChildren<SettingDialogProps<TFieldValues>>)
{
    const { children, defaultValues, description, onClose, onSubmit, open, title } = props;

    const closeLabel = props.closeLabel ?? 'Close';
    const submitLabel = props.submitLabel ?? 'Update';

    // ---------------------------------------------------------------------------------------------
    // Manual form context management, as we want to be able to clear state.
    // ---------------------------------------------------------------------------------------------
    const form = useForm({ defaultValues });
    const { reset } = form;

    // ---------------------------------------------------------------------------------------------
    // Internal handling for user interactions within the dialog.
    // ---------------------------------------------------------------------------------------------
    const [ errorMessage, setErrorMessage ] = useState<string>();
    const [ successMessage, setSuccessMessage ] = useState<string>();

    const [ loading, setLoading ] = useState<boolean>(false);

    const handleClose = useCallback(async (
        event: unknown, reason?: 'backdropClick' | 'escapeKeyDown') =>
    {
        try {
            if (onClose)
                await onClose(reason ?? 'button');
        } finally {
            await new Promise(resolve => setTimeout(resolve, /* duration.standard= */ 300));

            reset();

            setErrorMessage(undefined);
            setSuccessMessage(undefined);
            setLoading(false);
        }
    }, [ onClose, reset ]);

    const handleSubmit = useCallback(async (data: TFieldValues) => {
        setErrorMessage(undefined);
        setSuccessMessage(undefined);
        setLoading(true);

        try {
            if (onSubmit) {
                const result = await onSubmit(data);
                if ('error' in result)
                    setErrorMessage(result.error);
                else
                    setSuccessMessage(result.success);
            }
        } catch (error: any) {
            setErrorMessage(error.message ?? 'An unknown error occurred.');
            console.error('Unable to submit a <SettingDialog>:', error);
        } finally {
            setLoading(false);
        }
    }, [ onSubmit ]);

    // ---------------------------------------------------------------------------------------------
    // The actual React component.
    // ---------------------------------------------------------------------------------------------
    return (
        <Dialog open={!!open} onClose={handleClose} fullWidth>
            <FormContainer formContext={form} onSuccess={handleSubmit}>
                <DialogTitle>
                    {title}
                </DialogTitle>
                <DialogContent>
                    { description &&
                        <Typography sx={{ pb: 2 }}>
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
                    <LoadingButton disabled={!!successMessage} loading={loading} type="submit"
                                   variant="contained">
                        {submitLabel}
                    </LoadingButton>
                </DialogActions>
            </FormContainer>
        </Dialog>
    );
}
