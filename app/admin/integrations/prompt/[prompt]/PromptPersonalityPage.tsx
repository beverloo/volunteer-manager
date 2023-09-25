// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { FormContainer, SelectElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Typography from '@mui/material/Typography';

import type { User } from '@lib/auth/User';
import type { VertexAiDefinition } from '@app/api/admin/vertexAi';
import { issueServerAction } from '@lib/issueServerAction';

import {
    VertexPromptBuilder, type VertexPromptHumour, kHumourOptions, type VertexPromptIdentity,
    kIdentityOptions, type VertexPromptTone, kToneOptions } from '@lib/VertexPromptBuilder';

/**
 * Structure of a response to a prompt request.
 */
type PromptResponse = { tone: string; prompt?: string; response?: string; };

/**
 * Information required in order to predict a response.
 */
interface PromptRequest {
    basePrompt: string;

    name: string;
    team: string;

    humour: VertexPromptHumour;
    identity: VertexPromptIdentity;
    tone: VertexPromptTone;

    values: Record<string, string>;
    update: Dispatch<SetStateAction<PromptResponse[]>>;
}

/**
 * Requests the given `prompt` to be executed. The `prompt` contains all the information necessary
 * to finish and display the result, which can stream in as responses are completed.
 */
async function requestPrompt(prompt: PromptRequest): Promise<void> {
    const builder = VertexPromptBuilder.createForPerson(prompt.name, prompt.team)
        .forSituation(prompt.basePrompt)
        .withHumour(prompt.humour)
        .withIdentity(prompt.identity)
        .withTone(prompt.tone);

    for (const [ key, value ] of Object.entries(prompt.values))
        builder.withValue(key, value);

    const composedPrompt = builder.build();

    prompt.update(existingValues => {
        const indexToUpdate = existingValues.findIndex(v => v.tone === prompt.tone);
        if (indexToUpdate !== -1)
            existingValues[indexToUpdate].prompt = composedPrompt;

        return existingValues;
    });

    const response = await issueServerAction<VertexAiDefinition>('/api/admin/vertex-ai', {
        prompt: composedPrompt,
    });

    if (!response.result)
        return;

    prompt.update(existingValues => {
        const indexToUpdate = existingValues.findIndex(v => v.tone === prompt.tone);
        if (indexToUpdate !== -1)
            existingValues[indexToUpdate].response = response.result;

        return existingValues;
    });
}

/**
 * Props accepted by the <PromptPersonalityPage> component.
 */
export interface PromptPersonalityPageProps {
    /**
     * Name of the prompt for which this page is being shown.
     */
    promptName: string;

    /**
     * The prompt that this page is demonstrating.
     */
    prompt: string;

    /**
     * The user who is signed in to their account and is viewing this page.
     */
    user: User;
}

/**
 * The <PromptPersonalityPage> component
 */
export function PromptPersonalityPage(props: PromptPersonalityPageProps) {
    const [ loading, setLoading ] = useState<boolean>(false);

    const [ humourOptions, identityOptions ] = useMemo(() => [
        Object.keys(kHumourOptions).map(humour => ({ id: humour, label: humour })),
        Object.keys(kIdentityOptions).map(identity => ({ id: identity, label: identity })),
    ], [ /* no deps */ ]);

    const form = useForm({
        defaultValues: {
            prompt: props.prompt,

            date: 'June 7, 2024',  // {date}
            event: 'AnimeCon 2024',  // {event}
            name: props.user.firstName,  // {name}
            volunteer: 'Fritz',  // {volunteer}
            humour: 'Sometimes',
            identity: 'Team',
        },
    });

    const [ responses, setResponses ] = useState<PromptResponse[]>([]);

    const handleSubmit = useCallback(async () => {
        setResponses(Object.keys(kToneOptions).map(tone => ({ tone })));
        setLoading(true);

        try {
            const values = form.getValues();
            const request = {
                basePrompt: values.prompt,

                name: values.name,
                team: 'Stewards',

                humour: values.humour as VertexPromptHumour,
                identity: values.identity as VertexPromptIdentity,
                // `tone` is deliberately omitted

                values: values,
                update: setResponses,
            };

            await Promise.all(
                Object.keys(kToneOptions).map(tone =>
                    requestPrompt({ tone: tone as VertexPromptTone, ...request }))
            );

        } catch (error: any) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [ form ]);

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>
                    Prompt personality
                    <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                        ({props.promptName})
                    </Typography>
                </Typography>
                <FormContainer formContext={form} onSuccess={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid xs={12}>
                            <TextFieldElement multiline name="prompt" fullWidth size="small" />
                        </Grid>

                        <Grid xs={4}>
                            <TextFieldElement name="date" label="{date}" fullWidth size="small" />
                        </Grid>
                        <Grid xs={4}>
                            <TextFieldElement name="event" label="{event}" fullWidth size="small" />
                        </Grid>
                        <Grid xs={4}>
                            <TextFieldElement name="name" label="{name}" fullWidth size="small" />
                        </Grid>

                        <Grid xs={4}>
                            <TextFieldElement name="volunteer" label="{volunteer}" fullWidth
                                              size="small" />
                        </Grid>
                        <Grid xs={4}>
                            <SelectElement name="humour" label="Humour" options={humourOptions}
                                           fullWidth size="small" />
                        </Grid>
                        <Grid xs={4}>
                            <SelectElement name="identity" label="Identity" fullWidth
                                           options={identityOptions} size="small" />
                        </Grid>

                        <Grid xs={12}>
                            <LoadingButton startIcon={ <SmartToyIcon /> } loading={loading}
                                           type="submit" variant="outlined">
                                Generate responses
                            </LoadingButton>
                        </Grid>
                    </Grid>
                </FormContainer>
            </Paper>
            { responses.map((response, index) =>
                <Paper key={index} sx={{ p: 2 }}>
                    <Typography variant="h5" sx={{ pb: 1 }}>
                        {response.tone}
                    </Typography>
                    <Collapse in={true}>
                        { response.response &&
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {response.response}
                            </Typography> }
                        { !response.response &&
                            <>
                                <Skeleton variant="text" animation="wave" width="80%" height={16} />
                                <Skeleton variant="text" animation="wave" width="60%" height={16} />
                                <Skeleton variant="text" animation="wave" width="70%" height={16} />
                                <Skeleton variant="text" animation="wave" width="40%" height={16} />
                            </> }
                    </Collapse>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                        {response.prompt}
                    </Typography>
                </Paper> )}
        </>
    )
}
