// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';

import { FormContainer, TextareaAutosizeElement } from 'react-hook-form-mui';

import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Props accepted by the <AiExplorer> component.
 */
export interface AiExplorerProps {
    /**
     * The personality common across all prompts.
     */
    personality: string;

    /**
     * The prompt this explorer should service.
     */
    prompt: string;
}

/**
 * The <AiExplorer> component allows prompts to be conveniently finetuned by having a single edit
 * environment for the common personality, the specific prompt and context for the prompt.
 */
export function AiExplorer(props: AiExplorerProps) {
    const [ error, setError ] = useState<string>();
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleGenerate = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            throw new Error('Not yet implemented.');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ ]);

    // TODO: Resulting prompt
    // TODO: Resulting context (from API)

    const defaultValues = useMemo(() => ({
        personality: props.personality,
        prompt: props.prompt,
    }), [ props ]);

    return (
        <FormContainer defaultValues={defaultValues} onSuccess={handleGenerate}>
            <Paper sx={{ p: 2 }}>
                <Grid container spacing={2}>
                    <Grid xs={3}>
                        <Typography variant="subtitle2">
                            Personality
                        </Typography>
                    </Grid>
                    <Grid xs={9}>
                        <TextareaAutosizeElement name="personality" size="small" fullWidth />
                    </Grid>

                    <Grid xs={3}>
                        <Typography variant="subtitle2">
                            Prompt
                        </Typography>
                    </Grid>
                    <Grid xs={9}>
                        <TextareaAutosizeElement name="prompt" size="small" fullWidth />
                    </Grid>

                    <Grid xs={3}>{ /* ... */ }</Grid>
                    <Grid xs={9}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <LoadingButton startIcon={ <SmartToyIcon /> } loading={loading}
                                           type="submit" variant="outlined">
                                    Generate responses
                            </LoadingButton>
                            {error &&
                                <Typography sx={{ color: 'error.main' }}>
                                    {error}
                                </Typography> }
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>
        </FormContainer>
    );
}
