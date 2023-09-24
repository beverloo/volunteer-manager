// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import AttributionIcon from '@mui/icons-material/Attribution';
import Button from '@mui/material/Button';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Divider from '@mui/material/Divider';
import LockResetIcon from '@mui/icons-material/LockReset';
import Paper from '@mui/material/Paper';
import PinIcon from '@mui/icons-material/Pin';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import UnpublishedIcon from '@mui/icons-material/Unpublished';

import type { ResetAccessCodeDefinition } from '@app/api/admin/resetAccessCode';
import type { ResetPasswordLinkDefinition } from '@app/api/admin/resetPasswordLink';
import type { UpdateActivationDefinition } from '@app/api/admin/updateActivation';
import type { VolunteerInfo } from './page';
import { ContrastBox } from '@app/admin/components/ContrastBox';
import { SettingDialog } from '@app/admin/components/SettingDialog';
import { issueServerAction } from '@lib/issueServerAction';
import { callApi } from '@lib/callApi';

/**
 * Props passed to the various dialog properties.
 */
interface DialogProps {
    /**
     * The account of the volunteer for whom this dialog is being shown.
     */
    account: VolunteerInfo['account'];

    /**
     * Callback function that should be called when the dialog is being closed.
     */
    onClose: (refresh?: boolean) => void;

    /**
     * Whether the dialog is currently open.
     */
    open?: boolean;
}

/**
 * Dialog that creates and/or retrieves a new access code for the volunteer. This enables the
 * volunteer to sign in once with a code as opposed to their password.
 */
function AccessCodeDialog(props: DialogProps) {
    const { account, onClose, open } = props;

    const handleSubmit = useCallback(async() => {
        const response = await issueServerAction<ResetAccessCodeDefinition>(
            '/api/admin/reset-access-code', {
                userId: account.userId
            });

        if (!response.accessCode)
            return { error: `Unable to retrieve ${account.firstName}'s access code right now` };

        return {
            success:
                <>{account.firstName}'s access code is <strong>{response.accessCode}</strong></>
        };
    }, [ account ]);

    return (
        <SettingDialog onClose={onClose} onSubmit={handleSubmit} open={open}
                       description={
                           <>
                               Request an access code for <strong>{account.firstName}</strong> using
                               which they can sign in to their account once to reset their password.
                           </> }
                       submitLabel="Request" title="Request an access code" />
    );
}

/**
 * Dialog that activates the volunteer's account. This enables their account for usage, meaning that
 * they can immediately continue with (hopefully!) participation.
 */
function ActivateDialog(props: DialogProps) {
    const { account, onClose, open } = props;

    const handleSubmit = useCallback(async() => {
        const response = await issueServerAction<UpdateActivationDefinition>(
            '/api/admin/update-activation',
            {
                userId: account.userId,
                activated: true,
            });

        if (response.success)
            return { success: `${account.firstName}'s account has been activated` };

        return {  error: `${account.firstName}'s account could not be activated right now` };

    }, [ account ]);

    return (
        <SettingDialog onClose={onClose} onSubmit={handleSubmit} open={open}
                       description={
                           <>
                               You can activate <strong>{account.firstName}</strong>'s account on
                               their behalf, which may be useful in case they aren't receiving our
                               e-mail messages.
                           </> }
                       submitLabel="Activate" title="Activate the account" />
    );
}

/**
 * Dialog that deactivates the volunteer's account. This prevents it from being used until another
 * administrator (re)enables their account.
 */
function DeactivateDialog(props: DialogProps) {
    const { account, onClose, open } = props;

    const handleSubmit = useCallback(async() => {
        const response = await issueServerAction<UpdateActivationDefinition>(
            '/api/admin/update-activation',
            {
                userId: account.userId,
                activated: false,
            });

        if (response.success)
            return { success: `${account.firstName}'s account has been deactivated` };

        return {  error: `${account.firstName}'s account could not be deactivated right now` };

    }, [ account ]);

    return (
        <SettingDialog onClose={onClose} onSubmit={handleSubmit} open={open}
                       description={
                           <>
                               You can deactivate the account owned by
                               <strong> {account.firstName}</strong>, which will sign them out and
                               stop them from signing in again.
                           </> }
                       submitLabel="Deactivate" title="Deactivate the account" />
    );
}

/**
 * Dialog that requests a reset of the volunteer's password. The volunteer will receive an e-mail
 * with a password reset link to re-gain access to their account.
 */
function PasswordResetDialog(props: DialogProps) {
    const { account, onClose, open } = props;

    const handleSubmit = useCallback(async() => {
        const response = await issueServerAction<ResetPasswordLinkDefinition>(
            '/api/admin/reset-password-link',
            {
                userId: account.userId
            });

        if (!response.link)
            return { error: 'The password reset link could not be created just now' };

        return {
            success: <MuiLink component={Link} href={response.link}>{response.link}</MuiLink>
        };

    }, [ account ]);

    return (
        <SettingDialog onClose={onClose} onSubmit={handleSubmit} open={open}
                       description={
                           <>
                               You can request a password reset link for
                               <strong> {account.firstName} </strong> using which they can
                               immediately reset their password. The link is yours to share
                               with them.
                           </> }
                       submitLabel="Request" title="Request a password reset" />
    );
}

/**
 * Dialog that confirms whether the administrator wants to impersonate this user. This will sign
 * them in as the user, with a "nested" session from which they can sign out again too.
 */
function ImpersonationDialog(props: DialogProps) {
    const { account, onClose, open } = props;

    const router = useRouter();

    const handleSubmit = useCallback(async () => {
        const response = await callApi('post', '/api/auth/sign-in-impersonate', {
            userId: account.userId,
            returnUrl: `/admin/volunteers/${account.userId}`,
        });

        if (response.success) {
            router.push('/');
            router.refresh();
            return { success: 'Impersonation successful. You are being forwarded…' };
        }

        return { error: 'Unable to impersonate this user right now.' };

    }, [ account, router ]);

    return (
        <SettingDialog onClose={onClose} onSubmit={handleSubmit} open={open}
                       description={
                           <>
                               You can impersonate <strong> {account.firstName}</strong>, which
                               means that you will be signed in to their account. You will be back
                               to your own account after signing out.
                           </> }
                       submitLabel="Impersonate" title="Impersonate this user" />
    )
}

/**
 * Props accepted by the <Header> component.
 */
export interface HeaderProps {
    /**
     * Information about the account of the volunteer for whom the header is shown.
     */
    account: VolunteerInfo['account'];

    /**
     * Whether the signed in user is an administrator.
     */
    isAdmin: boolean;
}

/**
 * The <Header> component provides access to the volunteer's primary identity and quick access
 * related to the workings of their account, for example to (de)activate them or request a new
 * passport or access code.
 */
export function Header(props: HeaderProps) {
    const { account, isAdmin } = props;

    const [ accessCodeOpen, setAccessCodeOpen ] = useState(false);
    const [ activateOpen, setActivateOpen ] = useState(false);
    const [ deactivateOpen, setDeactivateOpen ] = useState(false);
    const [ resetOpen, setResetOpen ] = useState(false);
    const [ impersonateOpen, setImpersonateOpen ] = useState(false);

    const router = useRouter();

    function requestClose(refreshState?: boolean) {
        if (refreshState)
            router.refresh();

        if (accessCodeOpen)
            setAccessCodeOpen(false);
        if (activateOpen)
            setActivateOpen(false);
        if (deactivateOpen)
            setDeactivateOpen(false);
        if (resetOpen)
            setResetOpen(false);
        if (impersonateOpen)
            setImpersonateOpen(false);
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                {account.firstName} {account.lastName}
            </Typography>
            <ContrastBox sx={{ mt: 1, px: 2, py: 1 }}>
                <Stack divider={ <Divider orientation="vertical" flexItem /> }
                       direction="row" spacing={1}>

                    { account.activated &&
                        <Button variant="text" startIcon={ <UnpublishedIcon /> }
                                onClick={ () => setDeactivateOpen(true) }>
                            Deactivate
                        </Button> }

                    { !account.activated &&
                        <Button variant="text" startIcon={ <CheckCircleIcon /> }
                                onClick={ () => setActivateOpen(true) }>
                            Activate
                        </Button> }

                    { isAdmin &&
                        <Button variant="text" startIcon={ <LockResetIcon /> }
                                onClick={ () => setResetOpen(true) }>
                            Reset password
                        </Button> }

                    <Button variant="text" startIcon={ <PinIcon /> }
                            onClick={ () => setAccessCodeOpen(true) }>
                        Access code
                    </Button>

                    { isAdmin &&
                        <Button variant="text" startIcon={ <AttributionIcon /> }
                                onClick={ () => setImpersonateOpen(true) }>
                            Impersonate
                        </Button> }

                </Stack>
            </ContrastBox>

            <AccessCodeDialog account={account} open={accessCodeOpen} onClose={requestClose} />
            <ActivateDialog account={account} open={activateOpen} onClose={requestClose} />
            <DeactivateDialog account={account} open={deactivateOpen} onClose={requestClose} />
            <PasswordResetDialog account={account} open={resetOpen} onClose={requestClose} />
            <ImpersonationDialog account={account} open={impersonateOpen} onClose={requestClose} />

        </Paper>
    );
}
