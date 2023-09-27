// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';

import { type FieldValues, FormContainer, TextareaAutosizeElement } from 'react-hook-form-mui';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { SubmitCollapse } from '../components/SubmitCollapse';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <AiPromptPersonality> component.
 */
export interface AiPromptPersonalityProps {
    /**
     * Base personality shared across the different prompts.
     */
    personality: string;
}

/**
 * The <AiPromptPersonality> component allows configuring the "scenario" or personality for messages
 * that the generative AI tool should produce. It's shared across all prompts.
 */
export function AiPromptPersonality(props: AiPromptPersonalityProps) {
    const [ error, setError ] = useState<string>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        try {
            const response = await callApi('put', '/api/ai/settings', {
                personality: data.personality
            });

            if (response.success)
                setInvalidated(false);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ /* no deps */ ]);

    const defaultValues = useMemo(() => ({
        personality: props.personality,
    }), [ props.personality ]);

    return (
        <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                    Personality
                </Typography>
                <TextareaAutosizeElement size="small" fullWidth name="personality"
                                         onChange={handleChange} />
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
            </Paper>
        </FormContainer>
    );
}
