// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import LinkOffIcon from '@mui/icons-material/LinkOff';

import type { ServerAction } from '@lib/serverAction';
import { ServerActionDialog } from '@app/admin/components/ServerActionDialog';

/**
 * Props accepted by the <AnonymizationButton> components.
 */
interface AnonymizationButtonProps {
    /**
     * The server action that should be invoked when anonymization has been confirmed.
     */
    action: ServerAction;

    /**
     * Name of the account that is about to by anonymized.
     */
    name: string;
}

/**
 * The <AnonymizationButton> component enables administrators to anonymize accounts. This ability
 * provides the ability to remove all associated account data, as required by European legislation.
 */
export function AnonymizationButton(props: AnonymizationButtonProps) {
    const [ dialogOpen, setDialogOpen ] = useState<boolean>(false);

    const handleDialogOpen = useCallback(() => setDialogOpen(true), [ /* no dependencies */ ]);
    const handleDialogClose = useCallback(() => setDialogOpen(false), [ /* no dependencies */ ]);

    return (
        <>
            <Button size="small" variant="outlined" color="error" startIcon={ <LinkOffIcon /> }
                    onClick={handleDialogOpen}>
                Anonymize this account…
            </Button>
            { dialogOpen &&
                <ServerActionDialog action={props.action} title="Anonymize this account"
                                    open={dialogOpen} onClose={handleDialogClose}
                                    description={
                                        <>
                                            You're about to anonymize the account owned by
                                            <strong> {props.name}</strong>. This will
                                            permanently scramble all stored data, including their
                                            name and e-mail address. The account will be permanently
                                            disabled.
                                        </> }
                                    submitLabel="Anonymize">
                    <Alert severity="error" sx={{ mt: 2 }}>
                        This action really can't be undone—unlike this warning in other places, we
                        actually mean it this time.
                    </Alert>
                </ServerActionDialog> }
        </>
    );
}
