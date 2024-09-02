// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';

import { type FieldValues, FormContainer, TextareaAutosizeElement } from '@proxy/react-hook-form-mui';

import Grid from '@mui/material/Grid2';

import { Section } from '@app/admin/components/Section';
import { SubmitCollapse } from '../../components/SubmitCollapse';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <AiPromptPersonality> component.
 */
interface AiPromptPersonalityProps {
    /**
     * Base personality shared across the different prompts.
     */
    personality: string;

    /**
     * The system instruction(s) that should be shared with the API.
     */
    systemInstruction: string;
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
                personality: data.personality,
                systemInstruction: data.systemInstruction,
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
        systemInstruction: props.systemInstruction,

    }), [ props.personality, props.systemInstruction ]);

    return (
        <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
            <Section title="Personality and context">
                <Grid container rowSpacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <TextareaAutosizeElement size="small" fullWidth name="personality"
                                                 label="Personality"
                                                 onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextareaAutosizeElement size="small" fullWidth name="systemInstruction"
                                                 label="System instructions"
                                                 onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <SubmitCollapse error={error} loading={loading} open={invalidated} />
                    </Grid>
                </Grid>
            </Section>
        </FormContainer>
    );
}
