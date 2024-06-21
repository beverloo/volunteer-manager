// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useFormState } from 'react-dom';

import { FormProvider, useForm } from 'react-hook-form-mui';

import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';

import type { ServerAction } from '@lib/serverAction';
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

    // TODO: defaultValues
    // TODO: scheme
}

/**
 * Props accepted by the <FormGridSection> component.
 *
 * @todo Rename <SectionHeader action> to something else now that React has a canonical `action`.
 */
export type FormGridSectionProps =
    FormGridSectionOwnProps & (Omit<SectionHeaderProps, 'action'> | { noHeader: true });

/**
 * The <FormGridSection> component represents a visually separated section of a page in the admin
 * area. The component is specialised for sections that contain form fields, and all its children
 * are expected to be <Grid> components, or fragments containing <Grid> components therein.
 *
 * This component supersedes the <FormContainer> component offered by react-hook-form-mui:
 * https://github.com/dohomi/react-hook-form-mui/blob/master/packages/rhf-mui/src/FormContainer.tsx
 */
export function FormGridSection(props: React.PropsWithChildren<FormGridSectionProps>) {
    const { action, children, ...sectionHeaderProps } = props;

    // TODO: s/useFormState/useActionState/ when React 19 rolls into Next.js, currently this fails
    // with an error ("... is not a function or its return value is not iterable").

    // TODO: Provide `defaultValues` to the form.

    // TODO: Update the form with new `defaultValues` when they have changed, e.g. because the
    // router has been refreshed by another update.

    // TODO: Convert DayJS values to something that can be read as a ZonedDateTime on the server.

    const [ state, submitForm, isPending ] =
        useFormState(async (state: unknown, formData: FormData) => {
            return await action(formData);
        },
        /* initialState= */ null);

    const methods = useForm();

    return (
        <FormProvider {...methods}>
            <form noValidate action={submitForm}>
                <Paper sx={{ p: 2 }}>
                    { !('noHeader' in sectionHeaderProps) &&
                        <SectionHeader {...sectionHeaderProps} /> }
                    <Grid container>
                        {children}
                        <Grid xs={12}>
                            <Button type="submit" disabled={isPending}>Submit</Button>
                        </Grid>
                        <Grid xs={6}>
                            State?: {JSON.stringify(state)}
                        </Grid>
                        <Grid xs={6}>
                            Pending?: {isPending ? 'y' : 'n'}
                        </Grid>
                    </Grid>
                </Paper>
            </form>
        </FormProvider>
    );
}
