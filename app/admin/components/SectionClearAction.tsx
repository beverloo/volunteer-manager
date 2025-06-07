// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useFormContext } from '@components/proxy/react-hook-form-mui';

import ClearIcon from '@mui/icons-material/Clear';
import DialogContentText from '@mui/material/DialogContentText';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import type { ServerAction } from '@lib/serverAction';
import { ConfirmationDialog } from './ConfirmationDialog';

/**
 * Props accepted by the <SectionClearAction> component.
 */
interface SectionClearActionProps {
    /**
     * The Server Action that should be invoked to commit the operation.
     */
    action: ServerAction;

    /**
     * The subject of the contents of this section.
     * @example 'Are you sure that you want to clear the {subject}'
     * @default 'section'
     */
    subject?: string;

    /**
     * Title to display in the header.
     */
    title: string;
}

/**
 * The <SectionClearAction> component displays a cross that can be used to clear information stored
 * in the section. A confirmation dialog will be shown prior to deletion.
 */
export function SectionClearAction(props: SectionClearActionProps) {
    const { action, subject, title } = props;

    const form = useFormContext();

    const [ confirmationOpen, setConfirmationOpen ] = useState<boolean>(false);

    const handleCommit = useCallback(async () => {
        try {
            const result = await action(new FormData);
            if (!result.success)
                return { error: result.error || 'Unable to clear the data on the server…' };

            if (!!result.clear && !!form) {
                for (const field of Object.keys(form.getValues()))
                    form.setValue(field, /* clear= */ '');
            }

            return true;

        } catch (error: any) {
            return { error: error.message };
        }
    }, [ action, form ]);

    return (
        <>
            <Tooltip title={`Clear the ${subject}`}>
                <IconButton onClick={ () => setConfirmationOpen(true) } size="small">
                    <ClearIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <ConfirmationDialog onClose={ () => setConfirmationOpen(false) }
                                onConfirm={handleCommit} title={title} open={confirmationOpen}>
                <DialogContentText>
                    Are you sure that you want to clear the {subject}? This action will permanently
                    remove the currently stored information.
                </DialogContentText>
            </ConfirmationDialog>
        </>
    );
}
