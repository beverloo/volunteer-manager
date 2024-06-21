// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useEffect, useState, useTransition } from 'react';

import { FormProvider, useForm } from '@proxy/react-hook-form-mui';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

import type { ServerAction, ServerActionResult } from '@lib/serverAction';
import { SectionHeader, type SectionHeaderProps } from './SectionHeader';

/**
 * Props accepted by the <FormGridSection> component that are directly owned by <FormGridSection>
 * component. Other props, e.g. that of the <SectionHeader>, will be included separately.
 */
interface FormGridSectionOwnProps {
    /**
     * The action that should be invoked when the form has been submitted.
     */
    action: ServerAction;

    /**
     * Default values that should be provided to the form. Can be updated while the form is visible,
     * in which case all non-dirty fields will have their values updated.
     */
    defaultValues?: Record<string, any>;
}

/**
 * Props accepted by the <FormGridSection> component.
 *
 * @todo Rename <SectionHeader action> to something else now that React has a canonical `action`.
 */
export type FormGridSectionProps =
    FormGridSectionOwnProps & (Omit<SectionHeaderProps, 'action' | 'sx'> | { noHeader: true });

/**
 * The <FormGridSection> component represents a visually separated section of a page in the admin
 * area. The component is specialised for sections that contain form fields, and all its children
 * are expected to be <Grid> components, or fragments containing <Grid> components therein.
 *
 * This component supersedes the <FormContainer> component offered by react-hook-form-mui:
 * https://github.com/dohomi/react-hook-form-mui/blob/master/packages/rhf-mui/src/FormContainer.tsx
 */
export function FormGridSection(props: React.PropsWithChildren<FormGridSectionProps>) {
    const { action, children, defaultValues, ...sectionHeaderProps } = props;

    const [ isPending, startTransition ] = useTransition();
    const [ state, setState ] = useState<ServerActionResult | undefined>();

    // TODO: Convert DayJS values to something that can be read as a ZonedDateTime on the server.

    const form = useForm({ defaultValues });
    const router = useRouter();

    useEffect(() => {
        form.reset(defaultValues, {
            keepDirtyValues: true,
        });
    }, [ defaultValues, form ]);

    const handleSubmit = form.handleSubmit(async (data: unknown) => {
        await startTransition(async () => {
            const result = await action(data);
            if (!!result.success) {
                form.reset({ /* fields */ }, {
                    keepDirtyValues: true,
                    keepValues: true,
                });

                if (!!result.redirect)
                    router.push(result.redirect);

                if (!!router.refresh)
                    router.refresh();
            }

            setState(result);
        });
    });

    return (
        <FormProvider {...form}>
            <form noValidate onSubmit={handleSubmit}>
                <Paper sx={{ p: 2 }}>
                    { !('noHeader' in sectionHeaderProps) &&
                        <SectionHeader {...sectionHeaderProps} sx={{ pb: 1 }} /> }
                    <Grid container spacing={2}>
                        {children}
                        <Collapse in={!!form.formState.isDirty} sx={{ width: '100%' }}>
                            <Grid xs={12}>
                                <Stack direction="row" spacing={1} alignItems="center"
                                       sx={{
                                           backgroundColor: '#fff4e5',
                                           borderRadius: 2,
                                           padding: 1,
                                       }}>
                                    <LoadingButton variant="contained" type="submit"
                                                   loading={!!isPending}>
                                        Save changes
                                    </LoadingButton>
                                    { (!!state && !state.success) &&
                                        <Alert severity="warning" sx={{flexGrow: 1, px: 1, py: 0}}>
                                            { state.error || 'The changes could not be saved' }
                                        </Alert> }
                                </Stack>
                            </Grid>
                        </Collapse>
                    </Grid>
                </Paper>
            </form>
        </FormProvider>
    );
}
