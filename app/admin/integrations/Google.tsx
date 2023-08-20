// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import { type FieldValues, FormContainer, SelectElement, TextFieldElement }
    from 'react-hook-form-mui';

import type { SxProps, Theme } from '@mui/system';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';

import type { UpdateIntegrationDefinition } from '@app/api/admin/updateIntegration';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Custom styles applied to the <Google> component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    unsavedWarning: {
        backgroundColor: theme => theme.palette.mode === 'light' ? red[50] : red[900],
        borderRadius: 1,
        padding: 1,
        marginTop: 2,
    },
};

/**
 * Google endpoint locations that are available in the Volunteer Manager.
 *
 * @todo Update the locations once PaLM rolls out beyond us-central1.
 */
const kLocationOptions = [
    //{ id: 'europe-west2', label: 'London (europe-west2)' },
    //{ id: 'europe-west4', label: 'Amsterdam (europe-west4)' },
    { id: 'us-central1', label: 'Iowa (us-central1)' },
    //{ id: 'us-west1', label: 'Oregon (us-west1)' },
];

/**
 * Settings applicable to the <Google> component that can be edited through this component.
 */
export interface GoogleSettings {
    /**
     * The credential that should be used for communicating with Google APIs.
     */
    credential: string;

    /**
     * The physical location in which Google API calls should be executed.
     */
    location: string;

    /**
     * The Google Project ID through which Google API calls will be billed.
     */
    projectId: string;
}

/**
 * Props accepted by the <Google> component.
 */
export interface GoogleProps {
    /**
     * The settings for which this integration should be displayed.
     */
    settings: GoogleSettings;
}

/**
 * The <Google> component displays the available configuration that we use for accessing Google's
 * services. Service administrators further have the option of changing all settings.
 */
export function Google(props: GoogleProps) {
    const { settings } = props;

    const [ error, setError ] = useState<string>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const doInvalidate = useCallback(() => setInvalidated(true), [ setInvalidated ]);
    const requestSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        try {
            await issueServerAction<UpdateIntegrationDefinition>('/api/admin/update-integration', {
                google: {
                    credential: data.credential,
                    location: data.location,
                    projectId: data.projectId,
                },
            });
            setInvalidated(false);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ setError, setInvalidated, setLoading ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Google
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                The service account provides access to both data on Drive and to Google's API
                offering, such as the Vertex AI APIs.
            </Alert>
            <FormContainer defaultValues={settings} onSuccess={requestSubmit}>
                <Grid container spacing={2}>
                    <Grid xs={12}>
                        <TextFieldElement name="credential" label="Credential" fullWidth
                                          size="small" onChange={doInvalidate} />
                    </Grid>
                    <Grid xs={6}>
                        <SelectElement name="location" label="Location" fullWidth
                                       options={kLocationOptions} size="small"
                                       onChange={doInvalidate} />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="projectId" label="Project ID" fullWidth
                                          size="small" onChange={doInvalidate} />
                    </Grid>
                </Grid>
                <Collapse in={invalidated}>
                    <Box sx={kStyles.unsavedWarning}>
                        <LoadingButton loading={loading} variant="contained" type="submit">
                            Save changes
                        </LoadingButton>
                        { error &&
                            <Typography sx={{ display: 'inline-block', ml: 2 }}>
                                {error}
                            </Typography> }
                    </Box>
                </Collapse>
            </FormContainer>
        </Paper>
    );
}
