// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useState } from 'react';

import { type FieldValues, FormContainer } from 'react-hook-form-mui';

import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import LoadingButton from '@mui/lab/LoadingButton';

/**
 * Interface describing the information contained within a registration request. Will be shared with
 * the server in order to finalize a user's registration.
 */
export interface RegistrationRequest {
    /**
     * The user's first name.
     */
    firstName: string;

    /**
     * The user's last name.
     */
    lastName: string;

    /**
     * Gender of the user. A string because we don't care.
     */
    gender: string;

    /**
     * Date on which the user was born. (YYYY-MM-DD)
     */
    birthdate: string;

    /**
     * Phone number of the user, in an undefined format.
     */
    phoneNumber: string;

    /**
     * Whether the user has accepted the terms of our privacy policy.
     */
    gdpr: boolean;
}

/**
 * Props accepted by the <RegisterDialog> component.
 */
interface RegisterDialogProps {
    /**
     * To be invoked when the form should be closed, e.g. by being cancelled.
     */
    onClose: () => void;

    /**
     * To be invoked when the registration form is ready to be submitted. The promise will reject
     * when an error occurred (regardless of the type of error), whereas it will be resolved when
     * the registration request went through successfully.
     */
    onSubmit: (request: RegistrationRequest) => Promise<void>;
}

/**
 * The <RegisterDialog> dialog allows users to create a new account. They will be prompted for their
 * personal information, after which an account will be created for them.
 */
export function RegisterDialog(props: RegisterDialogProps) {
    const { onClose, onSubmit } = props;

    // Details:
    // - username [x]
    // - first name
    // - last name
    // - gender
    // - birthdate
    // - phone number

    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(false);

    async function requestRegistration(data: FieldValues) {
        setError(undefined);
        setLoading(true);

        try {
            await onSubmit(data as RegistrationRequest);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <FormContainer onSuccess={requestRegistration}>
            <DialogTitle>Create an account</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Please fill in the following details in order to create an account, which will
                    allow you to apply as a volunteer to one of the AnimeCon festivals.
                </DialogContentText>
                <Collapse in={!!error}>
                    <DialogContentText sx={{ paddingTop: 1 }} color="error">
                        {error}
                    </DialogContentText>
                </Collapse>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                <LoadingButton loading={loading} type="submit" variant="contained">
                    Update
                </LoadingButton>
            </DialogActions>
        </FormContainer>
    );
}
