// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useFormContext } from '@proxy/react-hook-form-mui';

import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

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
 * The <SalesUploadInput> component provides an input box through which a file can be selected that
 * is to be uploaded to the server. Changes to the selected file will invalidate the form that this
 * upload box is part of.
 */
export function SalesUploadInput() {
    const { register, watch } = useFormContext();

    const selectedFiles: undefined | FileList = watch('file');

    return (
        <Stack alignItems="center" direction="row" spacing={2}>
            <Button component="label" variant="outlined" startIcon={ <CloudUploadIcon /> }>
                Select file
                <VisuallyHiddenInput type="file" {...register('file')} accept=".csv" />
            </Button>
            { (!!selectedFiles && selectedFiles.length === 1) &&
                <Typography>
                    <strong>Selected</strong>: {selectedFiles[0].name}
                </Typography> }
        </Stack>
    );
}
