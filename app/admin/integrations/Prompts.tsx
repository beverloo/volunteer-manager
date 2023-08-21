// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import { type FieldValues, FormContainer, TextareaAutosizeElement } from 'react-hook-form-mui';

import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { UpdateIntegrationDefinition } from '@app/api/admin/updateIntegration';
import { SubmitCollapse } from '../components/SubmitCollapse';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Settings for the prompts box that can be changed by the user.
 */
export interface PromptSettings {
    /**
     * Base prompt upon which an acceptence response will be generated when an application has been
     * approved by a senior volunteer.
     */
    approveVolunteer: string;

    /**
     * Base prompt upon which a rejection response will be generated when a volunteer application
     * has been rejected by a senior volunteer.
     */
    rejectVolunteer: string;
}

/**
 * Props accepted by the <Prompts> components.
 */
export interface PromptsProps {
    /**
     * The settings that should be represented by this paper.
     */
    settings: PromptSettings;
}

/**
 * The <Prompts> component offers control over the LLM prompts that will be used to generate e-mail
 * messages towards volunteers. A limited number of prompts are available.
 */
export function Prompts(props: PromptsProps) {
    const { settings } = props;

    const [ error, setError ] = useState<string>();
    const [ loading, setLoading ] = useState<boolean>(false);

    const [ invalidated, setInvalidated ] = useState<boolean>(false);

    const requestSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);

        try {
            await issueServerAction<UpdateIntegrationDefinition>('/api/admin/update-integration', {
                prompts: {
                    approveVolunteer: data.approveVolunteer,
                    rejectVolunteer: data.rejectVolunteer,
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
            <FormContainer defaultValues={settings} onSuccess={requestSubmit}>
                <Grid container spacing={2}>
                    <Grid xs={3} display="flex" flexDirection="column" justifyContent="center"
                          alignItems="flex-start">
                        <Typography variant="button">
                            Approval prompt
                        </Typography>
                        <Typography variant="body2">
                            Base prompt to feed into Vertex AI when generating a volunteer
                            approval message.
                        </Typography>
                    </Grid>
                    <Grid xs={9}>
                        <TextareaAutosizeElement size="small" fullWidth name="approveVolunteer"
                                                 onChange={ () => setInvalidated(true) } />
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid xs={3} display="flex" flexDirection="column" justifyContent="center"
                          alignItems="flex-start">
                        <Typography variant="button">
                            Rejection prompt
                        </Typography>
                        <Typography variant="body2">
                            Base prompt to feed into Vertex AI when generating a volunteer
                            rejection message.
                        </Typography>
                    </Grid>
                    <Grid xs={9}>
                        <TextareaAutosizeElement size="small" fullWidth name="rejectVolunteer"
                                                 onChange={ () => setInvalidated(true) } />
                    </Grid>
                </Grid>
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}
