// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DoNotDisturbOnTotalSilenceIcon from '@mui/icons-material/DoNotDisturbOnTotalSilence';
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';

import { ContrastBox } from '@app/admin/components/ContrastBox';

/**
 * Props accepted by the <CommunicationDialog> component.
 */
export interface CommunicationDialogProps {
    /**
     * Whether sending out a communication can be skipped altogether. Should be guarded behind a
     * permission, and should ideally be used rarely.
     */
    allowSilent?: boolean;

    /**
     * Label to display on the close button. Defaults to "Close".
     */
    closeLabel?: string;

    /**
     * Label to display on the confirm button. Defaults to "Confirm".
     */
    confirmLabel?: string;

    /**
     * Description of the dialog. Optional.
     */
    description?: React.ReactNode;

    /**
     * To be called when the dialog is supposed to close. The `reason` indicates why the dialog has
     * been closed, in case behaviour should depend on those options.
     */
    onClose: (reason?: 'backdropClick' | 'button' | 'confirmed' | 'escapeKeyDown')
        => Promise<void> | void;

    /**
     * To be called when the dialog flow is complete and a communication is ready to be sent out.
     * The callback will be responsible for activating both the action, and sending out the actual
     * communication. The subject and message may be omitted for users with the "silent" permission.
     */
    onSubmit: (subject?: string, message?: string)
        => Promise<{ success: React.ReactNode } | { error: React.ReactNode }>;

    /**
     * Whether the dialog should be open.
     */
    open?: boolean;

    /**
     * Title of the dialog that should be displayed.
     */
    title: React.ReactNode;
}

/**
 * The <CommunicationDialog> component enables the leads to go through a dialog "wizard" that will
 * result in sending out a communication to a volunteer. The communication message will be generated
 * but can then be modified by the volunteer prior to being sent out.
 *
 * The dialog has several screens:
 *   (1) Language selection   - which language should be communication be written in?
 *   (2) Message confirmation - preview the generated message and make the necessary edits
 *   (3) Action confirmation  - confirm that the action itself was comleted successfully
 *
 * Dialogs will be given a type and a payload, which will be used in the to-be-generated message.
 */
export function CommunicationDialog(props: CommunicationDialogProps) {
    const { description, onClose, onSubmit, open, title } = props;

    const closeLabel = props.closeLabel ?? 'Close';
    const confirmLabel = props.confirmLabel ?? 'Confirm';

    const [ loading, setLoading ] = useState<boolean>(false);
    const [ state, setState ] = useState<'language' | 'message' | 'confirmation'>('language');

    // ---------------------------------------------------------------------------------------------
    // Common functionality
    // ---------------------------------------------------------------------------------------------

    const handleClose = useCallback(async (
        event: unknown, reason?: 'backdropClick' | 'confirmed' | 'escapeKeyDown') => {
        try {
            await onClose(reason ?? 'button');
        } finally {
            setTimeout(() => setState('language'), 300);
        }
    }, [ onClose ]);

    // ---------------------------------------------------------------------------------------------
    // State: `confirmation`
    // ---------------------------------------------------------------------------------------------

    const [ error, setError ] = useState<React.ReactNode | undefined>(undefined);
    const [ success, setSuccess ] = useState<React.ReactNode | undefined>(undefined);

    const handleSubmit = useCallback(async () => {
        try {
            const result = await onSubmit(/* subject= */ undefined, /* message= */ undefined);

            setState('confirmation');
            if ('error' in result)
                setError(result.error);
            else
                setSuccess(result.success);

        } finally {
            // TODO: Clean up state
        }
    }, [ onSubmit ]);

    // ---------------------------------------------------------------------------------------------
    // State: `message`
    // ---------------------------------------------------------------------------------------------

    const handleConfirm = useCallback(async () => {

    }, [ /* no deps */ ]);

    // ---------------------------------------------------------------------------------------------
    // State: `language`
    // ---------------------------------------------------------------------------------------------

    const [ messageLoading, setMessageLoading ] = useState<boolean>(false);

    const handleLanguageSelection = useCallback(async (language: 'nl' | 'en' | 'silent') => {
        if (messageLoading)
            return;

        setMessageLoading(true);
        try {
            switch (language) {
                case 'en':
                case 'nl':
                    // TODO: Generate a message and send that for review.
                    await new Promise(resolve => setTimeout(resolve, 2500));
                    break;
                case 'silent':
                    await handleSubmit();
                    break;
            }
        } finally {
            setMessageLoading(false);
        }
    }, [ handleSubmit, messageLoading ]);

    return (
        <Dialog open={!!open} onClose={handleClose} fullWidth>
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent>
                { description &&
                    <Typography sx={{ pb: 2 }}>
                        {description}
                    </Typography> }
                <Collapse in={state === 'language'}>
                    <Typography>
                        An e-mail will automatically be sent to let them know. In which language
                        should the message be written?
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" spacing={2}
                           alignItems="stretch" sx={{ mt: 2 }}>
                        <LanguageButton onClick={handleLanguageSelection} variant="nl" />
                        <LanguageButton onClick={handleLanguageSelection} variant="en" />
                        { props.allowSilent &&
                            <LanguageButton onClick={handleLanguageSelection} variant="silent" /> }
                    </Stack>
                </Collapse>
                <Collapse in={state === 'confirmation'}>
                    { error && <Alert severity="error">{error}</Alert> }
                    { success && <Alert severity="success">{success}</Alert> }
                </Collapse>
            </DialogContent>
            <DialogActions sx={{ pt: 0, mr: 2, mb: 1.5 }}>
                <Button onClick={handleClose} variant="text">{closeLabel}</Button>
                <LoadingButton loading={loading} onClick={handleConfirm} variant="contained"
                               disabled={ state !== 'message' }>
                    {confirmLabel}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}

/**
 * The British flag, in SVG format.
 * @see https://upload.wikimedia.org/wikipedia/en/a/ae/Flag_of_the_United_Kingdom.svg
 */
const kBritishFlag = (
    <SvgIcon fontSize="large">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="1200" height="600">
            <clipPath id="s">
                <path d="M0,0 v30 h60 v-30 z"/>
            </clipPath>
            <clipPath id="t">
                <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
            </clipPath>
            <g clip-path="url(#s)">
                <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
                <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>
                <path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#t)" stroke="#C8102E"
                    stroke-width="4"/>
                <path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/>
                <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/>
            </g>
        </svg>
    </SvgIcon>
);

/**
 * The Dutch flag, in SVG format.
 * @see https://upload.wikimedia.org/wikipedia/commons/2/20/Flag_of_the_Netherlands.svg
 */
const kDutchFlag = (
    <SvgIcon fontSize="large">
        <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 9 6">
            <rect fill="#21468B" width="9" height="6" />
            <rect fill="#FFF" width="9" height="4" />
            <rect fill="#AE1C28" width="9" height="2" />
        </svg>
    </SvgIcon>
);

/**
 * The "flag" to display for silent communication.
 */
const kCustomFlag = <DoNotDisturbOnTotalSilenceIcon color="action" fontSize="large" />;

/**
 * Language variant options that can be passed to the <LanguageButton> component.
 */
const kLanguageButtonVariantOptions = {
    en: ['English', kBritishFlag],
    nl: ['Dutch', kDutchFlag],
    silent: ['Silent', kCustomFlag],
};

/**
 * Props accepted by the <LanguageButton> component.
 */
interface LanguageButtonProps {
    /**
     * Callback that should be invoked when the button gets clicked on by the user.
     */
    onClick: (variant: keyof typeof kLanguageButtonVariantOptions) => Promise<void>;

    /**
     * The language variant that should be displayed on this button.
     */
    variant: keyof typeof kLanguageButtonVariantOptions;
}

/**
 * The <LanguageButton> component displays a button-like object with a flag and a label. It has a
 * loading state, which will be displayed when the response is being generated by another system.
 */
function LanguageButton(props: LanguageButtonProps) {
    const { onClick, variant } = props;

    const [ label, icon ] = kLanguageButtonVariantOptions[variant];
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleClick = useCallback(async () => {
        setLoading(true);
        try {
            await onClick(variant);
        } finally {
            setLoading(false);
        }
    }, [ onClick, variant ]);

    return (
        <Stack component={ContrastBox} direction="column" flexBasis="100%"
               justifyContent="center" alignItems="center" sx={{
                   cursor: 'pointer',
                   padding: 2,
                   userSelect: 'none',
                   '&:hover': {
                       backgroundColor: theme => theme.palette.action.focus,
                   }
               }} onClick={handleClick} spacing={1}>
            { loading && <CircularProgress color="primary" /> }
            { !loading &&
                <>
                    {icon}
                    <Typography>
                        {label}
                    </Typography>
                </> }
        </Stack>
    );
}
