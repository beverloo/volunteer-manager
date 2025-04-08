// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useCallback, useState } from 'react';

import { type FieldValues, AutocompleteElement, FormContainer, TextFieldElement, SelectElement }
    from '@proxy/react-hook-form-mui';

import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

import type { EventShiftRowModel } from '@app/api/admin/event/shifts/[[...id]]/route';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';

/**
 * What sort of shift types are available? We support different user interfaces for shifts that are
 * associated with an activity, versus shifts that are not, as we need location information to be
 * known for the latter.
 */
const kShiftTypeOptions = [
    { id: 'program', label: 'Shift for a program entry' },
    { id: 'initiative', label: 'Shift for our own initiative' },
];

/**
 * Props accepted by the <ShiftSettingsForm> component.
 */
export interface ShiftSettingsFormProps {
    /**
     * The activities that can be selected when creating this shift.
     */
    activities: { id: number; label: string }[];

    /**
     * The categories of shifts that can be selected when creating a new one.
     */
    categories: { id: number; label: string }[];

    /**
     * The locations within which shifts of our own initiative can be located.
     */
    locations: { id: number; label: string }[];

    /**
     * Whether the `name` field should be included for either type of shift.
     */
    includeName?: boolean;

    /**
     * Whether the form has been invalidated and the submit should be shown.
     */
    invalidated?: boolean;

    /**
     * Callback to be invoked when the form is being submitted. Submission is considered to be
     * successful unless an exception is thrown. (I.e. the promise is rejected.)
     */
    onSubmit: (data: FieldValues) => Promise<void>;

    /**
     * Whether the form should be in read-only mode.
     */
    readOnly?: boolean;

    /**
     * Default values that should be applied to the form, if any.
     */
    shift?: Omit<EventShiftRowModel, 'colour'> & { colour?: string; };
}

/**
 * The <ShiftSettingsForm> component manages the settings regarding a particular shift. It's used
 * both for creating new shifts, and managing existing shifts. The form may be displayed in read-
 * only mode in case a volunteer does not have permission to change the settings.
 */
export function ShiftSettingsForm(props: React.PropsWithChildren<ShiftSettingsFormProps>) {
    const { onSubmit, readOnly, shift } = props;

    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const [ type, setType ] = useState<'program' | 'initiative' | undefined>(
        !!shift ? (!!shift.activityId ? 'program' : 'initiative')
                : undefined);

    const handleChangeType = useCallback((value: 'program' | 'initiative') => {
        setInvalidated(true);
        setType(value);
    }, []);

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setError(undefined);
        setLoading(true);
        try {
            switch (data.type) {
                case 'program':
                    if (typeof data.activityId !== 'number' || !data.activityId)
                        throw new Error('Please pick an activity for the shift.');

                    if (!!props.includeName) {
                        if (typeof data.name !== 'string' || !data.name.length)
                            throw new Error('Please give the shift a name.');
                    }

                    await onSubmit({
                        categoryId: data.categoryId,
                        activityId: data.activityId,
                        name: !!props.includeName ? data.name : undefined,

                        fields: data,
                    });

                    break;

                case 'initiative':
                    if (typeof data.name !== 'string' || !data.name.length)
                        throw new Error('Please give the shift a name.');

                    if (typeof data.locationId !== 'number' || !data.locationId)
                        throw new Error('Please give the shift a location.');

                    await onSubmit({
                        categoryId: data.categoryId,
                        locationId: data.locationId,
                        name: data.name,

                        fields: data,
                    });

                    break;
            }
            setInvalidated(false);
        } catch (error: any) {
            setError(error.message ?? 'The shift could not be created!');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [ onSubmit, props.includeName ]);

    return (
        <FormContainer defaultValues={{ ...shift, type }} onSuccess={handleSubmit}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <SelectElement name="categoryId" label="Category" options={props.categories}
                                   size="small" fullWidth required disabled={readOnly} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <SelectElement name="type" label="Type of shift" options={kShiftTypeOptions}
                                   size="small" fullWidth onChange={handleChangeType}
                                   required disabled={readOnly}/>
                </Grid>
            </Grid>
            <Collapse in={type === 'program'}>
                <Stack direction="column" spacing={2} sx={{ mt: 2 }}>
                    <AutocompleteElement name="activityId" label="Associated activity"
                                         options={props.activities} matchId
                                         autocompleteProps={{
                                             disabled: readOnly,
                                             fullWidth: true,
                                             onChange: handleChange,
                                             size: 'small',
                                         }} />
                    { !!props.includeName &&
                        <TextFieldElement name="name" label="Shift name" fullWidth size="small"
                                          onChange={handleChange} disabled={readOnly} /> }
                </Stack>
            </Collapse>
            <Collapse in={type === 'initiative'}>
                <Stack direction="column" spacing={2} sx={{ mt: 2 }}>
                    <TextFieldElement name="name" label="Shift name" fullWidth size="small"
                                      onChange={handleChange} disabled={readOnly} />
                    <SelectElement name="locationId" label="Location" options={props.locations}
                                   size="small" fullWidth onChange={handleChange}
                                   disabled={readOnly} />
                </Stack>
            </Collapse>
            {props.children}
            <SubmitCollapse error={error} open={!!invalidated || !!props.invalidated}
                            loading={loading} sx={{ mt: 2 }} />
        </FormContainer>
    );
}
