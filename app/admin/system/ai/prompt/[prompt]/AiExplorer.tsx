// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { type FieldValues, FormContainer, SelectElement, TextareaAutosizeElement }
    from '@proxy/react-hook-form-mui';

import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { callApi } from '@lib/callApi';
import type { GeneratePromptDefinition } from '@app/api/ai/generatePrompt';

/**
 * Options available for the language selection box.
 */
const kLanguageOptions = [
    { id: 'Dutch', label: 'Dutch' },
    { id: 'English', label: 'English' },
    { id: 'French', label: 'French' },
    { id: 'German', label: 'German' },
    { id: 'Japanese', label: 'Japanese' },
    { id: 'Spanish', label: 'Spanish' },
];

/**
 * Props accepted by the <AiExplorer> component.
 */
interface AiExplorerProps {
    /**
     * The personality common across all prompts.
     */
    personality: string;

    /**
     * The prompt this explorer should service.
     */
    prompt: string;

    /**
     * The type of prompt that should be generated; passed to the API.
     */
    type: string;
}

/**
 * The <AiExplorer> component allows prompts to be conveniently finetuned by having a single edit
 * environment for the common personality, the specific prompt and context for the prompt.
 */
export function AiExplorer(props: AiExplorerProps) {
    const [ error, setError ] = useState<string>();
    const [ loading, setLoading ] = useState<boolean>(false);

    type Prompt = GeneratePromptDefinition['response']['newPrompt'];
    const [ generatedPrompt, setGeneratedPrompt ] = useState<Prompt>();

    const [ generatedContext, setGeneratedContext ] = useState<string[] | undefined>();
    const [ xxgeneratedPrompt, xxsetGeneratedPrompt ] = useState<string | undefined>();
    const [ generatedResult, setGeneratedResult ] =
        useState<{ subject?: string; message: string } | undefined>();

    const handleGenerate = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        try {
            const response = await callApi('post', '/api/ai/generate/:type', {
                type: props.type as any,
                language: data.language,

                approveVolunteer: {
                    userId: /* Ferdi= */ 3,
                    event: '2025',
                    team: 'stewards',
                },

                overrides: {
                    personality: data.personality,
                    prompt: data.prompt,
                },
            });

            if (response.success) {
                setGeneratedPrompt(response.newPrompt);
                setGeneratedResult(response.result);

                setGeneratedContext(response.context);
                xxsetGeneratedPrompt(response.prompt);
            } else {
                setError(response.error);
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ props.type ]);

    const defaultValues = useMemo(() => ({
        language: 'English',
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

                    <Grid xs={3}>
                        <Typography variant="subtitle2">
                            Language
                        </Typography>
                    </Grid>
                    <Grid xs={9}>
                        <SelectElement name="language" size="small" fullWidth
                                       options={kLanguageOptions} />
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
            <Collapse in={!!generatedResult}>
                <Paper sx={{ p: 2, mt: 2 }}>
                    { generatedResult?.subject &&
                        <Typography variant="h5" sx={{ mb: 1 }}>
                            {generatedResult?.subject}
                        </Typography> }
                    <Typography sx={{ whiteSpace: 'pre-wrap', lineBreak: 'loose' }}>
                        {generatedResult?.message}
                    </Typography>
                </Paper>
            </Collapse>
            <Collapse in={!!generatedPrompt && !!generatedPrompt.params}>
                <Paper sx={{ p: 2, mt: 2 }}>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                        Prompt input parameters
                    </Typography>
                    <Grid container rowSpacing={2}>
                        { Object.entries(generatedPrompt?.params || {}).map(([ key, value ]) =>
                            <React.Fragment key={key}>
                                <Grid xs={2}>
                                    <strong>{key}</strong>:
                                </Grid>
                                <Grid xs={10}>
                                    {value}
                                </Grid>
                            </React.Fragment> )}
                    </Grid>
                </Paper>
            </Collapse>
            <Collapse in={!!generatedPrompt && !!generatedPrompt.context}>
                <Paper sx={{ p: 2, mt: 2 }}>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                        Prompt generated context
                    </Typography>
                    <Grid container rowSpacing={2}>
                        { Object.entries(generatedPrompt?.context || {}).map(([ key, value ]) =>
                            <React.Fragment key={key}>
                                <Grid xs={2}>
                                    <strong>{key}</strong>:
                                </Grid>
                                <Grid xs={10} sx={{ whiteSpace: 'pre-wrap',
                                                    overflowWrap: 'anyhere' }}>
                                    { JSON.stringify(value, undefined, /* space= */ 4) }
                                </Grid>
                            </React.Fragment> )}
                    </Grid>
                </Paper>
            </Collapse>
            <Collapse in={!!generatedPrompt && !!generatedPrompt.message.length}>
                <Paper sx={{ p: 2, mt: 2 }}>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                        Prompt
                    </Typography>
                    <List dense>
                        {generatedPrompt?.message.map((line, index) =>
                            <ListItem key={index} disablePadding>
                                <ListItemIcon sx={{ minWidth: '40px' }}>
                                    <ArrowRightIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    {line}
                                </ListItemText>
                            </ListItem> )}
                    </List>
                </Paper>
            </Collapse>

            { /* TODO: Remove ----------------------------------------------------------------- */ }

            <Collapse in={!!generatedContext && generatedContext.length > 0}>
                <Paper sx={{ p: 2, mt: 2 }}>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                        Generated context
                    </Typography>
                    <List dense>
                        { generatedContext?.map((context, index) =>
                            <ListItem key={index} disablePadding>
                                <ListItemIcon sx={{ minWidth: '40px' }}>
                                    <ArrowRightIcon />
                                </ListItemIcon>
                                <ListItemText>
                                    {context}
                                </ListItemText>
                            </ListItem> )}
                    </List>
                </Paper>
            </Collapse>
            <Collapse in={!!xxgeneratedPrompt}>
                <Paper sx={{ p: 2, mt: 2 }}>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                        Generated prompt
                    </Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap', lineBreak: 'loose' }}>
                        {xxgeneratedPrompt}
                    </Typography>
                </Paper>
            </Collapse>
        </FormContainer>
    );
}
