// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';

import type { ServerAction } from '@lib/serverAction';
import { ContrastBox } from '@app/admin/components/ContrastBox';

/**
 * Props accepted by the <AccountHeaderActions> component.
 */
interface AccountHeaderActionsProps {
    /**
     * First name of the account holder, to contextualise warning prompts.
     */
    firstName: string;

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
}

/**
 * The <AccountHeaderActionsProps> component provides a number of quick actions to alter the state
 * of the account that's being viewed, for example to (de)activate it or change its password. The
 * user interface will be built based on the server actions passed to this component.
 */
export function AccountHeaderActions(props: AccountHeaderActionsProps) {
    return (
        <>
            <ContrastBox sx={{ mt: 1, px: 2, py: 1 }}>
                <Stack divider={ <Divider orientation="vertical" flexItem /> }
                       direction="row" spacing={1}>

                    { /* TODO: Deactivate */ }
                    { /* TODO: Activate */ }
                    { /* TODO: Reset password */ }
                    { /* TODO: Access code */ }
                    { /* TODO: Impersonate */ }

                </Stack>
            </ContrastBox>
        </>
    );
}
