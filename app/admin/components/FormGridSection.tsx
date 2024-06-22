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
 * This component creates a React Hook Form context for all contained form fields, and automatically
 * includes a submission section that will be shown when any of the contained form fields has been
 * invalidated. On submission, it will post a React Server Action to the given `action`. When the
 * request was successful, the form will be revalidated, and any instructions given by the Server
 * Action -- such as router mutations -- will be imposed.
 *
 * Furthermore, the component manages the default values for the form. These can be mutated when the
 * page refreshes, for example due to data changes elsewhere. In those cases the form fields that
 * have not been touched will be updated with their new values automatically.
 *
 * This component supersedes the <FormContainer> component offered by react-hook-form-mui:
 * https://github.com/dohomi/react-hook-form-mui/blob/master/packages/rhf-mui/src/FormContainer.tsx
 */
export function FormGridSection(props: React.PropsWithChildren<FormGridSectionProps>) {
    const { action, children, defaultValues, ...sectionHeaderProps } = props;

    const [ isPending, startTransition ] = useTransition();
    const [ state, setState ] = useState<ServerActionResult | undefined>();

    const form = useForm({ defaultValues });
    const router = useRouter();

    // For the values we pass to `reset()`, see the following react-hook-form documentation:
    // https://react-hook-form.com/docs/useform/reset

    useEffect(() => {
        form.reset(defaultValues, {
            // DirtyFields and isDirty will remained, and only none dirty fields will be updated to
            // the latest rest value.
            keepDirtyValues: true,
        });
    }, [ defaultValues, form ]);

    const handleSubmit = form.handleSubmit(async (data: unknown) => {
        await startTransition(async () => {
            // TODO: Convert DayJS values to something that can be read as a ZonedDateTime on the
            // server. Do we need to do this in reverse as well? (I.e. mutate `defaultValues`?)

            const result = await action(data);
            if (!!result.success) {
                form.reset({ /* fields */ }, {
                    // Form input values will be unchanged.
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
