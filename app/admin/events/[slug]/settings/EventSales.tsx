// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { uploadSalesReport } from './EventSalesUploadFn';

/**
 * Input element that is hidden, but can overlap a regular button to allow for easy uploading of
 * a file. The selected file will only be uploaded to the server.
 *
 * @source https://mui.com/material-ui/react-button/#file-upload
 */
const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

/**
 * Props accepted by the <EventSales> component.
 */
export interface EventSalesProps {
    /**
     * Information about the event whose sales might be imported.
     */
    event: PageInfo['event'];
}

/**
 * Submit button to display as part of the <EventSales> component.
 */
function EventSalesSubmitButton(props: { invalidated: boolean }) {
    const { pending } = useFormStatus();
    return (
        <SubmitCollapse loading={pending} open={props.invalidated} sx={{ mt: 2 }} />
    );
}

/**
 * The <EventSales> component allows the latest event sales information to be imported into the
 * portal. The data can only be sourced from the external ticketing agent, and will be stored in
 * aggregate on our own databases.
 */
export function EventSales(props: EventSalesProps) {
    const [ response, formAction ] = useFormState(uploadSalesReport, { success: false });

    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ selectedFilename, setSelectedFilename ] = useState<string | undefined>();

    const handleFileSelected = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (!!event.currentTarget?.files && event.currentTarget.files.length === 1) {
            setSelectedFilename(event.currentTarget.files.item(0)?.name);
            setInvalidated(true);
        } else {
            setSelectedFilename(undefined);
            setInvalidated(false);
        }
    }, [ /* no dependencies */ ]);

    useEffect(() => {
        if (!!response.success) {
            setSelectedFilename(undefined);
            setInvalidated(false);
        }
    }, [ response ]);

    return (
        <form action={formAction}>
            <input type="hidden" name="event" value={props.event.slug} />
            <Collapse in={!!response.error}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {response.error}
                </Alert>
            </Collapse>
            <Collapse in={!!response.success}>
                <Alert severity="success" sx={{ mb: 2 }}>
                    The data has been imported successfully.
                </Alert>
            </Collapse>
            <Stack alignItems="center" direction="row" spacing={2}>
                <Button component="label" variant="outlined" startIcon={ <CloudUploadIcon /> }>
                    Select file
                    <VisuallyHiddenInput type="file" name="file" accept=".csv"
                                         onChange={handleFileSelected} />
                </Button>
                { !!selectedFilename &&
                    <Typography>
                        <strong>Selected</strong>: {selectedFilename}
                    </Typography> }
            </Stack>
            <EventSalesSubmitButton invalidated={invalidated} />
        </form>
    );
}
