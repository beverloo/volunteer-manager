// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip, { type ChipProps } from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

/**
 * Props accepted by the <AccountRestrictedChip> component.
 */
interface AccountRestrictedChipProps {
    /**
     * Name of the account holder. May be the first name.
     */
    name: string;

    /**
     * Reason that the account has been restricted.
     */
    reason: string;

    /**
     * Styles to apply to the `<Chip>` component, if any.
     */
    sx?: ChipProps['sx'];
}

/**
 * The <AccountRestrictedChip> component displays a small MUI <Chip> component that opens a dialog
 * when clicked upon, to indicate that the account has been restricted, including the reason.
 */
export function AccountRestrictedChip(props: AccountRestrictedChipProps) {
    const [ dialogEverOpen, setDialogEverOpen ] = useState<boolean>(false);
    const [ dialogOpen, setDialogOpen ] = useState<boolean>(false);

    const handleDialogClose = useCallback(() => setDialogOpen(false), [ /* no dependencies */ ]);
    const handleDialogOpen = useCallback(() => {
        setDialogEverOpen(true);
        setDialogOpen(true);
    }, [ /* no dependencies */ ]);

    return (
        <>
            <Tooltip title="This account has been restricted">
                <Chip color="error" label="restricted" size="small" clickable
                      onClick={handleDialogOpen} sx={{ ml: 1, mr: 'auto' }} />
            </Tooltip>
            { dialogEverOpen &&
                <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth>
                    <DialogTitle>
                        This account has been restricted
                    </DialogTitle>
                    <DialogContent>
                        <Typography>
                            Applications made by <strong>{props.name} </strong> have been
                            restricted from being approved. This cannot be overridden without
                            removing the restriction.
                        </Typography>
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            <strong>Reason for the restriction</strong>: {props.reason}
                        </Alert>
                    </DialogContent>
                    <DialogActions sx={{ pt: 0, mr: 2, mb: 1.5 }}>
                        <Button onClick={handleDialogClose} variant="text">Close</Button>
                    </DialogActions>
                </Dialog> }
        </>
    );
}
