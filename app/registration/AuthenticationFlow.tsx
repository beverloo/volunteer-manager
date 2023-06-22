// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useCallback, useState } from 'react';

import { type FieldValues, FormContainer, TextFieldElement } from 'react-hook-form-mui';

import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import LoadingButton from '@mui/lab/LoadingButton';

/**
 * Styles used by the various components that make up the authentication flow.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    formElements: { paddingTop: 2 },

    root: {
        '& .MuiDialogActions-spacing': {
            padding: 2,
            paddingRight: 3,  // for alignment with the input fields...
            paddingTop: 0,
        },
    },
};

/**
 * Progress in the authentication flow, influenced by the user's actions.
 */
type AuthenticationFlowState = 'username';

/**
 * Props accepted by the <UsernameDialog> component.
 */
interface UsernameDialogProps {
    /**
     *To be invoked when the form should be closed, e.g. by being cancelled.
     */
    onClose: () => void;

    /**
     * To be invoked when the username dialog has been submitted for the given `username`.
     */
    onSubmit: (username: string) => Promise<void>;
}

/**
 * Prompts the user for their username, which usually will be their e-mail address. Accepts both
 * submission and cancellation of the flow through the dialog's action buttons.
 */
function UsernameDialog(props: UsernameDialogProps) {
    const { onClose, onSubmit } = props;

    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(false);

    async function requestSubmit(data: FieldValues) {
        setError(undefined);
        setLoading(true);

        try {
            await onSubmit('username');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <FormContainer onSuccess={requestSubmit}>
            <DialogTitle>Hello there!</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Please enter your e-mail address to identify yourself with the AnimeCon
                    volunteer portal, even if you're just about to sign up.
                </DialogContentText>
                <Collapse in={!!error}>
                    <DialogContentText sx={{ paddingTop: 1 }} color="error">
                        {error}&nbsp;
                    </DialogContentText>
                </Collapse>
                <Box sx={kStyles.formElements}>
                    <TextFieldElement name="username" label="E-mail" type="email"
                                      fullWidth size="small" required />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <LoadingButton loading={loading} type="submit" variant="contained">
                    Proceed
                </LoadingButton>
            </DialogActions>
        </FormContainer>
    );
}

/**
 * Props accepted by the <AuthenticationFlow> component.
 */
export interface AuthenticationFlowProps {
    /**
     * Callback that will be invoked when the authorization flow should be closed.
     */
    onClose: () => void;

    /**
     * Whether the authorization flow should be opened.
     */
    open?: boolean;
}

/**
 * The <AuthenticationFlow> component provides an inline, modal-dialog based flow that allows users
 * to identify themselves in the volunteer manager.
 *
 * TODO: Support identification using access codes
 * TODO: Support identification using passwords
 * TODO: Support identification using passkeys
 * TODO: Support registration
 * TODO: Support lost password requests
 */
export function AuthenticationFlow(props: AuthenticationFlowProps) {
    const { onClose, open } = props;

    const [ authFlowState, setAuthFlowState ] = useState<AuthenticationFlowState>('username');

    // Supporting callbacks for any state:
    const onRequestClose = useCallback(() => {
        setAuthFlowState('username');
        onClose();

    }, [ onClose ]);

    // Supporting callbacks for the 'username' state:
    const onSubmitUsername = useCallback(async username => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        throw new Error('yo, something went wrong');
    }, []);

    return (
        <Dialog open={open} onClose={onRequestClose} sx={kStyles.root}>
            { authFlowState === 'username' &&
                <UsernameDialog onClose={onRequestClose} onSubmit={onSubmitUsername} /> }
        </Dialog>
    );
}
