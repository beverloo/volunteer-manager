// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import { type FieldValues, FormContainer, TextareaAutosizeElement,
    SliderElement } from 'react-hook-form-mui';

import type { SxProps, Theme } from '@mui/system';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import Skeleton from '@mui/material/Skeleton';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';

import type { UpdateIntegrationDefinition } from '@app/api/admin/updateIntegration';
import type { VertexAiDefinition } from '@app/api/admin/vertexAi';
import { PlaceholderPaper } from '@app/admin/components/PlaceholderPaper';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Example prompt that can be submitted from the integration page to test this API.
 */
const kExamplePrompt = `
    You are organising the volunteering teams for a convention named AnimeCon 2024. Write a brief
    email to tell your friend Fred, who applied to help out, that they unfortunately won't be able
    to help out this year because they applied on a Tuesday whereas we only accept applications
    that were submitted on Wednesday or Friday. Encourage them to try again next year.`;

/**
 * Custom styles applied to the <VertexAI> component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    unsavedWarning: {
        backgroundColor: theme => theme.palette.mode === 'light' ? red[50] : red[900],
        borderRadius: 1,
        padding: 1,
        marginTop: 1,
    },
};

/**
 * Props accepted by the <ServiceSettings> component.
 */
interface ServiceSettingsProps {
    /**
     * Settings at the initial rendering of this component. Can be updated by this component too.
     */
    settings: VertexAISettings;

    /**
     * To be called when the settings have changed.
     */
    onChange: (settings: VertexAISettings) => void;

    /**
     * To be called when the settings should be saved.
     */
    onSave: (settings: VertexAISettings) => Promise<void>;
}

/**
 * Settings for the Vertex AI service that can be configured. A save button will be shown when any
 * changes have been made, after which they will come into effect.
 */
function ServiceSettings(props: ServiceSettingsProps) {
    const { settings, onChange, onSave } = props;

    const [ error, setError ] = useState<string>();
    const [ loading, setLoading ] = useState<boolean>(false);

    const [ invalidated, setInvalidated ] = useState<boolean>(false);

    const onRequestSave = useCallback(async () => {
        setLoading(true);
        setError(undefined);

        try {
            await onSave(settings);
            setInvalidated(false);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ onSave, settings ]);

    const onTemperatureChange = useCallback((event: unknown, value: number | number[]) => {
        setInvalidated(true);
        onChange({ ...settings, temperature: Array.isArray(value) ? value[0] : value });
    }, [ onChange, settings ]);

    const onTokenLimitChange = useCallback((event: unknown, value: number | number[]) => {
        setInvalidated(true);
        onChange({ ...settings, tokenLimit: Array.isArray(value) ? value[0] : value });
    }, [ onChange, settings ]);

    const onTopKChange = useCallback((event: unknown, value: number | number[]) => {
        setInvalidated(true);
        onChange({ ...settings, topK: Array.isArray(value) ? value[0] : value });
    }, [ onChange, settings ]);

    const onTopPChange = useCallback((event: unknown, value: number | number[]) => {
        setInvalidated(true);
        onChange({ ...settings, topP: Array.isArray(value) ? value[0] : value });
    }, [ onChange, settings ]);

    return (
        <FormContainer defaultValues={settings} onSuccess={onRequestSave}>
            <Grid container spacing={2}>
                <Grid xs={6}>
                    <SliderElement name="temperature" label="Temperature" size="small"
                                   min={0} max={1} step={0.05}
                                   onChangeCommitted={onTemperatureChange} />
                </Grid>
                <Grid xs={6}>
                    <SliderElement name="tokenLimit" label="Token limit" size="small"
                                   min={1} max={1024} step={1}
                                   onChangeCommitted={onTokenLimitChange} />
                </Grid>
                <Grid xs={6}>
                    <SliderElement name="topK" label="Top K" size="small"
                                   min={1} max={40} onChangeCommitted={onTopKChange} />
                </Grid>
                <Grid xs={6}>
                    <SliderElement name="topP" label="Top P" size="small"
                                   min={0} max={1} step={0.05} onChangeCommitted={onTopPChange} />
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
    );
}

/**
 * Props accepted by the <InteractivePanel> component.
 */
interface InteractivePanelProps {
    /**
     * Callback that will be invoked when a prompt has been requested.
     */
    onRequest: (prompt: string) => Promise<void>;
}

/**
 * Panel that allows the administrator to see what the output of an example prompt would be. The
 * prompt is included as an input field in this panel, and can be activated as such.
 */
function InteractivePanel(props: InteractivePanelProps) {
    const [ loading, setLoading ] = useState<boolean>(false);

    const requestPrompt = useCallback(async (data: FieldValues) => {
        setLoading(true);
        try {
            await props.onRequest(data.prompt);
        } finally {
            setLoading(false);
        }
    }, [ props, setLoading ]);

    const normalizedPrompt = kExamplePrompt.replaceAll(/\s{2,}/g, ' ').trim();

    return (
        <Paper sx={{ flexBasis: '100%', p: 2, minHeight: '150px' }}>
            <FormContainer defaultValues={{ prompt: normalizedPrompt }} onSuccess={requestPrompt}>
                <TextareaAutosizeElement size="small" fullWidth name="prompt" />
                <Stack direction="row" justifyContent="flex-end" sx={{ pt: 2 }}>
                    <LoadingButton startIcon={ <SmartToyIcon /> } loading={loading}
                                   variant="outlined" type="submit">
                        Generate
                    </LoadingButton>
                </Stack>
            </FormContainer>
        </Paper>
    );
}

/**
 * Props accepted by the <InteractiveResponsePanel> component.
 */
interface InteractiveResponsePanelProps {
    /**
     * The response to display in the panel. Undefined means that it's still loading, and should not
     * be displayed as is yet.
     */
    response?: string;
}

/**
 * Panel that displays the response to the interactive panel's queries. This version of the panel
 * assumes that a response is (at least) being loaded, and thus supports a suspended state.
 */
function InteractiveResponsePanel(props: InteractiveResponsePanelProps) {
    const { response } = props;
    return (
        <Paper sx={{ flexBasis: '100%', p: 2 }}>
            { (!response) &&
                <>
                    <Skeleton variant="text" animation="wave" width="80%" height={16} />
                    <Skeleton variant="text" animation="wave" width="60%" height={16} />
                    <Skeleton variant="text" animation="wave" width="70%" height={16} />
                    <Skeleton variant="text" animation="wave" width="70%" height={16} />
                    <Skeleton variant="text" animation="wave" width="40%" height={16} />
                </> }
            <Collapse in={!!response}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {props.response}
                </Typography>
            </Collapse>
        </Paper>
    );
}

/**
 * Panel that is a placeholder for an interactive response panel, however for one that has not been
 * received yet. A placeholder panel is displayed instead, explaining that a result is pending.
 */
function InteractiveResponseIdlePanel() {
    return (
        <PlaceholderPaper sx={{ flexBasis: '100%' }}>
            <Stack direction="column" spacing={2} justifyContent="center" alignItems="center"
                   sx={{ color: 'text.disabled', height: '100%' }}>
                <PauseCircleOutlineIcon />
                <Typography variant="body2">
                    Waiting for a prompt to be submitted…
                </Typography>
            </Stack>
        </PlaceholderPaper>
    );
}

/**
 * Settings available to the Vertex AI integration. Descriptions and values are copied from the
 * Google Cloud Console page on generating e-mail examples.
 */
export interface VertexAISettings {
    /**
     * The model that should be used for generating responses.
     *
     * @see https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models
     */
    model: 'text-bison' | 'text-bison@001';

    /**
     * Temperature controls the degree of randomness in token selection. Lower temperatures are good
     * for prompts that expect a true or correct response, while higher temperatures can lead to
     * more diverse or unexpected results.
     *
     * @range Must be in range of [0, 1)
     * @example 0.5
     */
    temperature: number;

    /**
     * Token limit determines the maximum amount of text output from one prompt. A token is
     * approximately four characters.
     *
     * @range Must be in range of [1, 1024)
     * @example 256
     */
    tokenLimit: number;

    /**
     * Top-k changes how the model selects tokens for output. A top-k of 1 means the selected token
     * is the most probable among all tokens in the model’s vocabulary (also called greedy decoding)
     * while a top-k of 3 means that the next token is selected from among the 3 most probable
     * tokens (using temperature).
     *
     * @range Must be in range of [1, 40)
     * @example 40
     */
    topK: number;

    /**
     * Top-p changes how the model selects tokens for output. Tokens are selected from most probable
     * to least until the sum of their probabilities equals the top-p value.
     *
     * @range Must be in range of [0, 1)
     * @example 0.8
     */
    topP: number;
}

/**
 * Props for the <VertexAI> component.
 */
export interface VertexAIProps {
    /**
     * The Vertex AI settings that apply while the page is being loaded. May be modified during this
     * component's lifetime, however changes can be tried out first.
     */
    settings: VertexAISettings;
}

/**
 * The <VertexAI> component represents our integration with the Google Vertex AI APIs, which we use
 * to generate personalised messages to volunteers. It encapsulates both the settings, used prompts
 * and authentication used to communicate with the service.
 */
export function VertexAI(props: VertexAIProps) {
    const [ settings, setSettings ] = useState<VertexAISettings>(props.settings);

    const [ loading, setLoading ] = useState<boolean>(false);
    const [ response, setResponse ] = useState<string>();

    const generateResponse = useCallback(async (prompt: string) => {
        setLoading(true);
        setResponse(undefined);

        try {
            const response = await issueServerAction<VertexAiDefinition>('/api/admin/vertex-ai', {
                prompt,
                settings,
            });

            if (response.result)
                setResponse(response.result);

        } finally {
            setLoading(false);
        }

    }, [ settings ]);

    const updateSettings = useCallback((settings: VertexAISettings) => {
        setSettings(settings);
    }, [ setSettings ]);

    const saveSettings = useCallback(async () => {
        await issueServerAction<UpdateIntegrationDefinition>('/api/admin/update-integration', {
            vertexAi: settings,
        });
    }, [ settings ]);

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ pb: 1 }}>
                    Google Vertex AI
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                    This API is used to dynamically generate responses to volunteer applications, as
                    well as automated reminder e-mails as events come closer. Responses are
                    exclusively generated by express senior volunteer action, and are verified
                    before being sent out.
                </Alert>
                <ServiceSettings settings={props.settings} onChange={updateSettings}
                                 onSave={saveSettings} />
            </Paper>
            <Stack direction="row" spacing={2} alignItems="stretch">
                <InteractivePanel onRequest={generateResponse} />
                { (!loading && !response) && <InteractiveResponseIdlePanel /> }
                { (loading || response) && <InteractiveResponsePanel response={response} /> }
            </Stack>
        </>
    );
}
