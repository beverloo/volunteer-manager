// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import LaunchIcon from '@mui/icons-material/Launch';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

import type { ExportMetadata } from './ExportMetadata';
import { ExportType } from '@lib/database/Types';

/**
 * Props accepted by the <ExportAvailable> component.
 */
export interface ExportAvailableProps {
    /**
     * Metadata about the export that's being presented on this page.
     */
    metadata: ExportMetadata;
}

/**
 * The <ExportAvailable> component handles the case where the export data is available. The visitor
 * has to acknowledge that they want to access the data after which they can make an API call to
 * retrieve it. It will then be rendered client-side in their browser for consumption.
 */
export function ExportAvailable(props: ExportAvailableProps) {
    // TODO: (3) The export exists and is available, and has been accessed.

    let description: string;
    switch (props.metadata.type) {
        case ExportType.Training:
            description = 'training participation';
            break;
        case ExportType.Volunteers:
            description = 'volunteer participation';
            break;
        default:
            throw new Error(`Unrecognised export type: ${props.metadata.type}`);
    }

    const [ data, setData ] = useState<unknown>();
    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleAccessData = useCallback(async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            throw new Error('Not yet implemented');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false)
        }
    }, [ /* no deps */ ]);

    return (
        <>
            <Paper sx={{ p: 2, width: '75%', textAlign: 'center', textWrap: 'balance' }}>
                {props.metadata.userName} shared information about {props.metadata.eventName}{' '}
                {description} with you. Please treat this information carefully and let us know
                immediately if you received this in error.
            </Paper>
            <Collapse in={!!error} sx={{ width: '75%' }} unmountOnExit>
                <Alert elevation={1} severity="error" sx={{ px: 2, py: 1 }}>
                    {error}
                </Alert>
            </Collapse>
            <Collapse in={!data} sx={{ width: '75%' }} unmountOnExit>
                <Paper component={Stack} alignItems="center" sx={{ p: 2 }}>
                    <LoadingButton loading={loading} variant="contained" onClick={handleAccessData}
                                   startIcon={ <LaunchIcon /> }>
                        Access data
                    </LoadingButton>
                </Paper>
            </Collapse>
            <Collapse in={!!data} sx={{ width: '75%' }} unmountOnExit>
                <Paper sx={{ p: 2 }}>
                    Data goes here
                </Paper>
            </Collapse>
        </>
    );
}
