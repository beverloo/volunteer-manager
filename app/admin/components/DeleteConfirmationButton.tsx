// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@mui/material/Button';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Typography from '@mui/material/Typography';

import type { ServerAction } from '@lib/serverAction';
import { ConfirmationDialog } from './ConfirmationDialog';

/**
 * Props accepted by the <DeleteConfirmationButton> component.
 */
interface DeleteConfirmationButtonProps {
    /**
     * Server Action that should be invoked when confirmation has been received.
     */
    action: ServerAction;

    /**
     * Label that should be rendered on the button.
     */
    label: string;
}

/**
 * The <DeleteConfirmationButton> component displays an outlined delete button which, when clicked
 * on, shows a confirmation dialog that the action should indeed take place. When this has been
 * confirmed, the passed server action will be executed.
 */
export function DeleteConfirmationButton(
    props: React.PropsWithChildren<DeleteConfirmationButtonProps>)
{
    const action = props.action;
    const router = useRouter();

    const [ open, setOpen ] = useState<boolean>(false);

    const handleRequestDelete = useCallback(() => setOpen(true), [ /* no dependencies */ ]);
    const handleDelete = useCallback(async () => {
        const result = await action(new FormData);
        if (!result.success)
            return { error: result.error };

        if (!result.redirect)
            return { error: 'Expected a redirect to be given…' };

        router.push(result.redirect);
        return true;

    }, [ action, router ]);

    return (
        <>
            <Button color="error" size="small" variant="outlined" endIcon={ <DeleteOutlineIcon /> }
                    onClick={handleRequestDelete} sx={{ float: 'right' }}>
                {props.label}
            </Button>
            { open &&
                <ConfirmationDialog confirmLabel="Delete" title="Delete this environment?" open
                                    onClose={ () => setOpen(false) } onConfirm={handleDelete}>
                    <Typography variant="body1">
                        {props.children}
                    </Typography>
                </ConfirmationDialog> }
        </>
    );
}
