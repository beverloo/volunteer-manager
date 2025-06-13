// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useState } from 'react';

import { TextFieldElement } from '@components/proxy/react-hook-form-mui';

import Alert from '@mui/material/Alert';
import AttributionIcon from '@mui/icons-material/Attribution';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Divider from '@mui/material/Divider';
import LockResetIcon from '@mui/icons-material/LockReset';
import PauseIcon from '@mui/icons-material/Pause';
import PinIcon from '@mui/icons-material/Pin';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Stack from '@mui/material/Stack';
import UnpublishedIcon from '@mui/icons-material/Unpublished';

import type { ServerAction } from '@lib/serverAction';
import { ContrastBox } from '@app/admin/components/ContrastBox';
import { ServerActionDialog } from '@app/admin/components/ServerActionDialog';

/**
 * Props accepted by the <AccountHeaderActions> component.
 */
interface AccountHeaderActionsProps {
    /**
     * First name of the account holder, to contextualise warning prompts.
     */
    firstName: string;

    /**
     * Reason that the account has been suspended, if any.
     */
    suspendedReason?: string;

    /**
     * Server action to invoke when the account should be activated.
     */
    activateAccountFn?: ServerAction;

    /**
     * Server action to invoke when an access code should be created.
     */
    createAccessCodeFn?: ServerAction;

    /**
     * Server action to invoke when the account should be deactivated.
     */
    deactivateAccountFn?: ServerAction;

    /**
     * Server action to invoke when the account should be impersonated.
     */
    impersonateFn?: ServerAction;

    /**
     * Server action to invoke when the account's password should be reset.
     */
    resetPasswordFn?: ServerAction;

    /**
     * Server action to invoke when the account should be suspended.
     */
    suspendFn?: ServerAction;

    /**
     * Server action to invoke when the account should be unsuspended.
     */
    unsuspendFn?: ServerAction;
}

/**
 * The <AccountHeaderActionsProps> component provides a number of quick actions to alter the state
 * of the account that's being viewed, for example to (de)activate it or change its password. The
 * user interface will be built based on the server actions passed to this component.
 */
export function AccountHeaderActions(props: AccountHeaderActionsProps) {
    const [ activateAccountDialogOpen, setActivateAccountDialogOpen ] = useState(false);
    const [ createAccessCodeDialogOpen, setCreateAccessCodeDialogOpen ] = useState(false);
    const [ deactivateAccountDialogOpen, setDeactivateAccountDialogOpen ] = useState(false);
    const [ impersonateDialogOpen, setImpersonateDialogOpen ] = useState(false);
    const [ resetPasswordDialogOpen, setResetPasswordDialogOpen ] = useState(false);
    const [ suspendDialogOpen, setSuspendDialogOpen ] = useState(false);
    const [ unsuspendDialogOpen, setUnsuspendDialogOpen ] = useState(false);

    const hasAnyAction =
        props.activateAccountFn ||
        props.createAccessCodeFn ||
        props.deactivateAccountFn ||
        props.impersonateFn ||
        props.resetPasswordFn;

    if (!hasAnyAction)
        return <Box sx={{ height: '8px', mt: '0px !important' }} />;

    return (
        <>
            <ContrastBox sx={{ mt: 1, px: 2, py: 1 }}>
                <Stack divider={ <Divider orientation="vertical" flexItem /> }
                       direction="row" spacing={1}>

                    { !!props.deactivateAccountFn &&
                        <Button onClick={ () => setDeactivateAccountDialogOpen(true) }
                                startIcon={ <UnpublishedIcon /> }>
                            Deactivate
                        </Button> }

                    { !!props.activateAccountFn &&
                        <Button onClick={ () => setActivateAccountDialogOpen(true) }
                                startIcon={ <CheckCircleIcon /> }>
                            Activate
                        </Button> }

                    { !!props.suspendFn &&
                        <Button onClick={ () => setSuspendDialogOpen(true) }
                                startIcon={ <PauseIcon /> }>
                            Restrict
                        </Button> }

                    { !!props.unsuspendFn &&
                        <Button onClick={ () => setUnsuspendDialogOpen(true) }
                                startIcon={ <PlayArrowIcon /> }>
                            Unrestrict
                        </Button> }

                    { !!props.resetPasswordFn &&
                        <Button onClick={ () => setResetPasswordDialogOpen(true) }
                                startIcon={ <LockResetIcon /> }>
                            Reset password
                        </Button> }

                    { !!props.createAccessCodeFn &&
                        <Button onClick={ () => setCreateAccessCodeDialogOpen(true) }
                                startIcon={ <PinIcon /> }>
                            Access code
                        </Button> }

                    { !!props.impersonateFn &&
                        <Button onClick={ () => setImpersonateDialogOpen(true) }
                                startIcon={ <AttributionIcon /> }>
                            Impersonate
                        </Button> }

                </Stack>
            </ContrastBox>

            { !!props.activateAccountFn &&
                <ServerActionDialog
                    action={props.activateAccountFn}
                    description={
                        <>
                            Activate <strong>{props.firstName}</strong>'s account on their
                            behalf, which may be useful in case they aren't receiving our e-mail
                            messages.
                        </> }
                    onClose={ () => setActivateAccountDialogOpen(false) }
                    open={activateAccountDialogOpen}
                    submitLabel="Activate" title="Activate the account" /> }

            { !!props.deactivateAccountFn &&
                <ServerActionDialog
                    action={props.deactivateAccountFn}
                    description={
                        <>
                           Deactivating the account owned by <strong>{props.firstName}</strong> will
                           sign them out, and stops them from being able to sign in again.
                        </> }
                    onClose={ () => setDeactivateAccountDialogOpen(false) }
                    open={deactivateAccountDialogOpen}
                    submitLabel="Deactivate" title="Deactivate the account" /> }

            { !!props.createAccessCodeFn &&
                <ServerActionDialog
                    action={props.createAccessCodeFn}
                    description={
                        <>
                            Request an access code for <strong>{props.firstName}</strong> using
                            which they can sign in to their account once to reset their password.
                        </> }
                    onClose={ () => setCreateAccessCodeDialogOpen(false) }
                    open={createAccessCodeDialogOpen}
                    submitLabel="Request" title="Request an access code" /> }

            { !!props.impersonateFn &&
                <ServerActionDialog
                    action={props.impersonateFn}
                    description={
                        <>
                            You can impersonate <strong>{props.firstName}</strong>, which
                            means that you will be signed in to their account. You will be back
                            to your own account after signing out.
                        </> }
                    onClose={ () => setImpersonateDialogOpen(false) }
                    open={impersonateDialogOpen}
                    submitLabel="Impersonate" title="Impersonate this account" /> }

            { !!props.resetPasswordFn &&
                <ServerActionDialog
                    action={props.resetPasswordFn}
                    description={
                        <>
                            Request a password reset link for <strong>{props.firstName}</strong>,
                            using which they can immediately reset their password. The link is yours
                            to share with them.
                        </> }
                    onClose={ () => setResetPasswordDialogOpen(false) }
                    open={resetPasswordDialogOpen}
                    submitLabel="Request" title="Request a password reset" /> }

            { !!props.suspendFn &&
                <ServerActionDialog
                    action={props.suspendFn}
                    description={
                        <>
                            Restricting the account owned by <strong>{props.firstName}</strong> will
                            stop them from being approved as volunteers in any of our teams. The
                            reason will remain private.
                        </> }
                    onClose={ () => setSuspendDialogOpen(false) }
                    open={suspendDialogOpen}
                    submitLabel="Restrict" title="Restrict this account">
                    <TextFieldElement name="reason" label="Reason" size="small" fullWidth
                                      required sx={{ mt: 2 }} />
                </ServerActionDialog> }

            { !!props.unsuspendFn &&
                <ServerActionDialog
                    action={props.unsuspendFn}
                    description={
                        <>
                            Removing the restriction from the account owned by
                            <strong> {props.firstName}</strong> will enable their applications to be
                            approved again by team leads.
                        </> }
                    onClose={ () => setUnsuspendDialogOpen(false) }
                    open={unsuspendDialogOpen}
                    submitLabel="Unrestrict" title="Unrestrict this account">
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        <strong>Reason for the restriction</strong>: {props.suspendedReason}
                    </Alert>
                </ServerActionDialog> }
        </>
    );
}
