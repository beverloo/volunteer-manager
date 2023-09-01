// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import { FormContainer, TextFieldElement, useForm } from 'react-hook-form-mui';

import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Typography from '@mui/material/Typography';

import type { UserData } from '@lib/auth/UserData';

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
    user: UserData;
}

/**
 * The <PromptPersonalityPage> component
 */
export function PromptPersonalityPage(props: PromptPersonalityPageProps) {
    const [ loading, setLoading ] = useState<boolean>(false);

    const form = useForm({
        defaultValues: {
            prompt: props.prompt,

            date: 'June 7, 2024',  // {date}
            event: 'AnimeCon 2024',  // {event}
            name: props.user.firstName,  // {name}
            volunteer: 'Fritz',  // {volunteer}
        },
    });

    const handleSubmit = useCallback(async () => {
        setLoading(true);

        // Use `form.getValues()`
        await new Promise(resolve => setTimeout(resolve, 1500));

        setLoading(false);
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
                        { /* empty row */ }
                        { /* empty row */ }

                        <Grid xs={12}>
                            <LoadingButton startIcon={ <SmartToyIcon /> } loading={loading}
                                           type="submit" variant="outlined">
                                Generate responses
                            </LoadingButton>
                        </Grid>
                    </Grid>
                </FormContainer>
            </Paper>
        </>
    )
}
