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
import Typography from '@mui/material/Typography';

import type { CreditsDataExport, TrainingsDataExport, VolunteersDataExport } from '@app/api/exports/route';
import type { ExportMetadata } from './ExportMetadata';
import { ExportCredits } from './ExportCredits';
import { ExportTrainings } from './ExportTrainings';
import { ExportType } from '@lib/database/Types';
import { ExportVolunteers } from './ExportVolunteers';
import { callApi } from '@lib/callApi';

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
    const { metadata } = props;

    let description: string;
    switch (metadata.type) {
        case ExportType.Credits:
            description = 'credit real consent';
            break;
        case ExportType.Trainings:
            description = 'training participation';
            break;
        case ExportType.Volunteers:
            description = 'volunteer participation';
            break;
        default:
            throw new Error(`Unrecognised export type: ${metadata.type}`);
    }

    const [ credits, setCredits ] = useState<CreditsDataExport | undefined>();
    const [ trainings, setTrainings ] = useState<TrainingsDataExport | undefined>();
    const [ volunteers, setVolunteers ] = useState<VolunteersDataExport | undefined>();

    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleAccessData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await callApi('post', '/api/exports', {
                slug: metadata.slug,
            });

            if (response.success) {
                setCredits(response.credits);
                setTrainings(response.trainings);
                setVolunteers(response.volunteers);
            } else {
                setError(response.error ?? 'Unable to retrieve the data from our server');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false)
        }
    }, [ metadata.slug ]);

    return (
        <>
            <Paper sx={{ p: 2, textAlign: 'center', textWrap: 'balance' }}>
                {metadata.userName} shared information about {metadata.eventName} {description}{' '}
                with you. Please treat this information carefully and let us know immediately if you
                received this in error.
            </Paper>
            <Collapse in={!!error} unmountOnExit>
                <Alert elevation={1} severity="error" sx={{ px: 2, py: 1 }}>
                    {error}
                </Alert>
            </Collapse>
            <Collapse in={!credits && !trainings && !volunteers} unmountOnExit>
                <Paper component={Stack} alignItems="center" sx={{ p: 2 }}>
                    <LoadingButton loading={loading} variant="contained" onClick={handleAccessData}
                                   startIcon={ <LaunchIcon /> }>
                        Access data
                    </LoadingButton>
                </Paper>
            </Collapse>
            <Collapse in={!!credits} unmountOnExit>
                <ExportCredits credits={credits!} />
            </Collapse>
            <Collapse in={!!trainings} unmountOnExit>
                <ExportTrainings trainings={trainings!} />
            </Collapse>
            <Collapse in={!!volunteers} unmountOnExit>
                <ExportVolunteers volunteers={volunteers!} />
            </Collapse>
        </>
    );
}
