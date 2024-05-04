// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import LoadingButton from '@mui/lab/LoadingButton';

import type { DisplayHelpRequestTarget } from '@lib/database/Types';

import { kHelpRequestColours } from '@app/admin/system/displays/HelpRequestColours';

/**
 * Props accepted by the <AcknowledgeForm> component.
 */
export interface AcknowledgeFormProps {
    /**
     * Unique slug of the event for which the request is in scope.
     */
    event: string;

    /**
     * Unique ID of the request that can be acknowledged.
     */
    requestId: number;

    /**
     * Target of the help request. Used to determine the button's colour.
     */
    target: DisplayHelpRequestTarget;
}

/**
 * The <AcknowledgeForm> component provides the ability to acknowledge a help request. A
 * confirmation dialog will be shown to make sure that the volunteer actually will head over.
 */
export function AcknowledgeForm(props: AcknowledgeFormProps) {
    const [ foreground, background ] = kHelpRequestColours[props.target];

    const router = useRouter();

    // ---------------------------------------------------------------------------------------------
    // Ability to confirm the acknowledgement
    // ---------------------------------------------------------------------------------------------

    const [ confirmationOpen, setConfirmationOpen ] = useState<boolean>(false);
    const [ error, setError ] = useState<string | undefined>();

    const closeConfirmation = useCallback(() => setConfirmationOpen(false), [ /* no deps */ ]);
    const openConfirmation = useCallback(() => {
        setConfirmationOpen(true);
        setError(undefined);
    }, [ /* no deps */ ]);

    // ---------------------------------------------------------------------------------------------
    // Ability to submit the acknowledgement
    // ---------------------------------------------------------------------------------------------

    const [ loading, setLoading ] = useState<boolean>(false);

    const handleAcknowledge = useCallback(async () => {
        setError(undefined);
        setLoading(true);
        try {
            // TODO: Submit the request to the server.
            await new Promise(resolve => setTimeout(resolve, 1500));
            throw new Error;

            router.refresh();

        } catch (error: any) {
            setError(error.message || 'The request could not be acknowledged');
        } finally {
            setLoading(false);
        }
    }, [ props.event, props.requestId, router ]);

    // ---------------------------------------------------------------------------------------------

    return (
        <>
            <LoadingButton fullWidth variant="contained" startIcon={ <DirectionsRunOutlinedIcon /> }
                           onClick={openConfirmation} loading={!!confirmationOpen}
                           sx={{
                               backgroundColor: background,
                               color: foreground,

                               '&:active': { backgroundColor: background, color: foreground },
                               '&:focus': { backgroundColor: background, color: foreground },
                               '&:hover': { backgroundColor: background, color: foreground },
                           }}>
                On my way!
            </LoadingButton>
            <Dialog fullWidth open={confirmationOpen} onClose={closeConfirmation}>
                <DialogTitle>
                    Will you handle this request?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Only acknowledge requests that you're able to attend to <strong>
                        in the next five minutes</strong>, otherwise let someone else deal with it.
                    </DialogContentText>
                    <Collapse in={!!error}>
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    </Collapse>
                </DialogContent>
                <DialogActions sx={{ pr: 2, pb: 2 }}>
                    <Button color="inherit" onClick={closeConfirmation}>Close</Button>
                    <LoadingButton
                        variant="contained" onClick={handleAcknowledge} loading={!!loading}
                        sx={{
                            backgroundColor: background,
                            color: foreground,

                            '&:active': { backgroundColor: background, color: foreground },
                            '&:focus': { backgroundColor: background, color: foreground },
                            '&:hover': { backgroundColor: background, color: foreground },
                        }}>
                        On my way!
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </>
    );
}
