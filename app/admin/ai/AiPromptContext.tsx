// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import React, { useCallback, useMemo, useState } from 'react';

import { type FieldValues, FormContainer, TextareaAutosizeElement } from 'react-hook-form-mui';

import { default as MuiLink } from '@mui/material/Link';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { SubmitCollapse } from '../components/SubmitCollapse';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <AiPromptContext> component.
 */
export interface AiPromptContextProps {
    /**
     * The prompts that should be dispalyed on this page.
     */
    prompts: {
        /**
         * Label, through which it should be indicated to the volunteer.
         */
        label: string;

        /**
         * The prompt that's configured for this particular case.
         */
        prompt: string;

        /**
         * Name of the setting, as it will be uploaded to the server.
         */
        setting: string;
    }[];
}

/**
 * The <AiPromptContext> component lists the context unique to each of the cases in which we'll use
 * generative AI to generate messages.
 */
export function AiPromptContext(props: AiPromptContextProps) {
    const { prompts } = props;

    const [ error, setError ] = useState<string>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        try {
            const updates = Object.fromEntries(prompts.map(prompt => ([
                prompt.setting,
                data[prompt.setting] ?? prompt.prompt ?? '',
            ])));

            const response = await callApi('put', '/api/ai/settings', {
                prompts: updates as any,
            });

            if (response.success)
                setInvalidated(false);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ prompts ]);

    const defaultValues = useMemo(() => Object.fromEntries(prompts.map(prompt => ([
        prompt.setting,
        prompt.prompt,
    ]))), [ prompts ]);

    return (
        <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                    Prompts
                </Typography>
                <Grid container spacing={2}>
                    { prompts.map(prompt =>
                        <React.Fragment key={prompt.setting}>
                            <Grid xs={3}>
                                <Typography variant="subtitle2">
                                    {prompt.label}
                                </Typography>
                                <Typography variant="body2">
                                    <MuiLink component={Link}
                                             href={`./ai/prompt/${prompt.setting.substring(14)}`}>
                                        Explore prompt
                                    </MuiLink>
                                </Typography>
                            </Grid>
                            <Grid xs={9}>
                                <TextareaAutosizeElement name={prompt.setting} size="small"
                                                         onChange={handleChange} fullWidth />
                            </Grid>
                        </React.Fragment> )}
                </Grid>
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
            </Paper>
        </FormContainer>
    );
}
