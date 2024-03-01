// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

import { type FieldValues, FormContainer, TextFieldElement } from 'react-hook-form-mui';

import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { MDXEditorMethods } from '@mdxeditor/editor';
import type { ContentRowModel, ContentScope } from '@app/api/admin/content/[[...id]]/route';
import { Temporal, formatDate } from '@lib/Temporal';
import { callApi } from '@lib/callApi';
import { validateContentPath } from './ContentCreate';

import '@mdxeditor/editor/style.css';

/**
 * Dynamically import the ContentEditorMdx component. Disable server-side rendering as that leads to
 * an hydration error in the NextJS app router.
 */
const ContentEditorMdx = dynamic(() => import('./ContentEditorMdx'), { ssr: false });

/**
 * Props accepted by the <ContentEditor> component.
 */
export interface ContentEditorProps {
    /**
     * Unique ID of the content that should be loaded. Will automatically be fetched from the API.
     */
    contentId: number;

    /**
     * Whether the path should be hidden in its entirety, in case it's not relevant for the type of
     * contant for which the editor is being presented.
     */
    pathHidden?: boolean;

    /**
     * Prefix to display at the beginning of the content's path.
     */
    pathPrefix?: string;

    /**
     * Scope of the content that should be editable.
     */
    scope: ContentScope;
}

/**
 * The <ContentEditor> component is a fully functional content editor, built upon an MDX editor that
 * provides near-WYSIWYG editing capabilities. The editor will be lazily loaded to not contribute
 * to the bundle size, while still being available when it needs to be.
 */
export function ContentEditor(props: React.PropsWithChildren<ContentEditorProps>) {
    const ref = useRef<MDXEditorMethods>(null);

    const [ defaultValues, setDefaultValues ] = useState<ContentRowModel>();

    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ success, setSuccess ] = useState<string | undefined>();

    const handleSave = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        setSuccess(undefined);
        try {
            if (!ref || !ref.current)
                throw new Error('Cannot locate the Markdown content on this page');

            const response = await callApi('put', '/api/admin/content/:id', {
                id: props.contentId,
                context: props.scope,
                row: {
                    id: props.contentId,
                    content: ref.current.getMarkdown(),
                    path: data.path ?? defaultValues?.path,
                    title: data.title,
                    updatedOn: '',  // ignored
                    updatedBy: '',  // ignored
                    updatedByUserId: 0,  // ignored
                    protected: false,  // ignored
                },
            });

            if (response.success)
                setSuccess('The changes have been saved');
            else
                setError(response.error ?? 'The changes could not be saved');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ defaultValues, props.contentId, props.scope, ref ]);

    const [ contentProtected, setContentProtected ] = useState<boolean>(false);
    const [ markdown, setMarkdown ] = useState<string>();

    useEffect(() => {
        callApi('get', '/api/admin/content/:id', {
            id: props.contentId,
            context: props.scope
        }).then(response => {
            if (response.success) {
                setDefaultValues({
                    ...response.row,
                    updatedOn:
                        formatDate(
                            Temporal.ZonedDateTime.from(response.row.updatedOn),
                            'YYYY-MM-DD[T]HH:mm:ss[Z]'),
                });

                setContentProtected(!!response.row.protected);
                setMarkdown(response.row.content);
            } else {
                setError(response.error ?? 'Unable to load the content from the server');
            }
        });
    }, [ props.contentId, props.scope ]);

    if (!defaultValues) {
        return (
            <Paper sx={{ p: 2 }}>
                {props.children}
                <Collapse in={!!error}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                </Collapse>
                <Skeleton variant="text" animation="wave" width="80%" height={16} />
                <Skeleton variant="text" animation="wave" width="60%" height={16} />
                <Skeleton variant="text" animation="wave" width="70%" height={16} />
                <Skeleton variant="text" animation="wave" width="70%" height={16} />
                <Skeleton variant="text" animation="wave" width="40%" height={16} />
            </Paper>
        );
    }

    return (
        <FormContainer defaultValues={defaultValues} onSuccess={handleSave}>
            <Paper sx={{ p: 2 }}>
                {props.children}
                <Grid container spacing={2}>
                    <Grid xs={12}>
                        <TextFieldElement name="title" label="Content title" fullWidth size="small"
                                          required />
                    </Grid>
                    { !props.pathHidden &&
                        <Grid xs={12}>
                            <Stack direction="row" spacing={1}>
                                { props.pathPrefix &&
                                    <Typography sx={{ pt: '9px' }}>
                                        {props.pathPrefix}
                                    </Typography> }
                                <TextFieldElement name="path" label="Content path" fullWidth
                                                  size="small" required={!contentProtected}
                                                  validation={{
                                                      validate:
                                                          contentProtected ? undefined
                                                                           : validateContentPath
                                                  }} InputProps={{ readOnly: !!contentProtected }}/>
                            </Stack>
                        </Grid> }
                </Grid>
            </Paper>
            <Paper sx={{ mt: 2, p: 2, pb: '0.1px' }}>
                <ContentEditorMdx innerRef={ref} markdown={markdown} />
            </Paper>
            <Paper sx={{ mt: 2, p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <LoadingButton loading={!!loading} variant="contained" type="submit">
                        Save changes
                    </LoadingButton>
                    { error &&
                        <Typography sx={{ color: 'error.main' }}>
                            {error}
                        </Typography> }
                    { success &&
                        <Typography sx={{ color: 'success.main' }}>
                            {success}
                        </Typography> }
                </Stack>
            </Paper>
        </FormContainer>
    );
}
