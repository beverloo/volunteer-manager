// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';

import type { GetDocumentationDefinition } from '@app/api/admin/documentation/getDocumentation';
import { Markdown } from '@app/components/Markdown';

/**
 * Type describing the result of a GET request to //api/admin/documentation.
 */
type GetDocumentationResult = GetDocumentationDefinition['response'];

/**
 * Fetcher used to retrieve the schedule from the server.
 */
const fetcher = (url: string) => fetch(url).then(r => r.json());

/**
 * Props accepted by the <DocumentationDialog> component.
 */
interface DocumentationDialogProps {
    /**
     * Callback that will be invoked when the dialog should be closed.
     */
    onClose?: () => void;

    /**
     * Whether the dialog should be shown to the user.
     */
    open: boolean;

    /**
     * Topic that should be shown in the dialog. Dynamically loaded from the server.
     */
    topic: string;
}

/**
 * The <DocumentationDialog> component displays a dialog to the user in which a certain topic is
 * explained in more detail, for example how to manage specific parts of the organisation process.
 */
export default function DocumentationDialog(props: DocumentationDialogProps) {
    const endpoint = useMemo(() => `/api/admin/documentation?topic=${props.topic}`, [props.topic]);

    const { data, error, isLoading } = useSWR<GetDocumentationResult>(endpoint, fetcher, {
        revalidateOnMount: true,
    });

    return (
        <Dialog fullWidth maxWidth="md" onClose={props.onClose} open={props.open}
                scroll="paper">
            <DialogContent>
                <Collapse in={!!error}>
                    <Alert severity="error">
                        { error?.message ?? 'The client was not able to obtain the documentation.' }
                    </Alert>
                </Collapse>
                <Collapse in={data?.success === false}>
                    <Alert severity="error">
                        { data?.error ?? 'The server was not able to provide the documentation.' }
                    </Alert>
                </Collapse>
                { (!isLoading && data?.success === true) &&
                    <Markdown sx={{
                        '& h5:first-child': { pb: 0.5, fontSize: 24 }
                    }}>{data.markdown}</Markdown> }
                { (isLoading && !error) &&
                    <>
                        <Skeleton variant="text" animation="wave" width="80%" height={16} />
                        <Skeleton variant="text" animation="wave" width="60%" height={16} />
                        <Skeleton variant="text" animation="wave" width="70%" height={16} />
                        <Skeleton variant="text" animation="wave" width="70%" height={16} />
                        <Skeleton variant="text" animation="wave" width="40%" height={16} />
                    </> }
            </DialogContent>
            <Divider />
            <DialogActions sx={{ pt: 1, mr: 1, mb: 0 }}>
                <Button onClick={props.onClose} variant="text">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
