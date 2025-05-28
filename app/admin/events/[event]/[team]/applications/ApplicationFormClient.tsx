// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback } from 'react';

import { AutocompleteElement, useFormContext, type AutocompleteElementProps } from '@components/proxy/react-hook-form-mui';

import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';

import { ApplicationAvailabilityForm, ApplicationParticipationForm }
    from '@app/registration/[slug]/application/ApplicationParticipation';

/**
 * Type definition indicating props for the <AutocompleteElement> used by the form. This propagates
 * the (potentially inferred) type and disables the multiple, clearable and FreeSolo options.
 */
type AutocompleteElementPropsType<TValue> =
    AutocompleteElementProps<TValue,
                             /* Multiple= */ false,
                             /* DisableClearable= */ false,
                             /* FreeSolo= */ false>;

/**
 * The <ApplicationFormClient> component wraps the application form on the client side to provide
 * the necessary interaction for this component to provide a good user experience.
 */
export function ApplicationFormClient<TValue>(props: AutocompleteElementPropsType<TValue>) {
    const { autocompleteProps, name, ...restProps } = props;

    const { watch } = useFormContext();
    const formOpen = !!watch(name);

    const handleOptionDisabled = useCallback((option: any) => {
        return !!option.disabled;
    }, [ /* no dependencies */ ]);

    return (
        <>
            <Grid size={{ xs: 12 }}>
                <AutocompleteElement
                    name={name} {...restProps}
                    autocompleteProps={{
                        ...autocompleteProps,
                        getOptionDisabled: handleOptionDisabled,
                    }} />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ display: !!formOpen ? 'initial' : 'none' }}>
                <Collapse in={!!formOpen}>
                    <Grid container spacing={2}>
                        <ApplicationParticipationForm />
                        <ApplicationAvailabilityForm />
                    </Grid>
                </Collapse>
            </Grid>
        </>
    );
}
