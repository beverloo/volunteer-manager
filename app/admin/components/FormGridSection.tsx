// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

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
import { Temporal } from '@lib/Temporal';
import { dayjs } from '@lib/DateTime';

/**
 * Regular expression to match a given value as something that may be interpretable by the Temporal
 * `ZonedDateTime` structure. This is not meant to be comprehensive, rather a detection tool after
 * which we'll feed it to `ZonedDateTime` properly to consider the display timezone as well.
 *
 * @source http://dotat.at/tmp/ISO_8601-2004_E.pdf
 */
const kTemporalZonedDateTimeRegexp =
    /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d)/;

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

    /**
     * Name of the timezone through which dates and times included in the `defaultValues` should be
     * interpret. Defaults to UTC.
     */
    timezone?: string;
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
    const { action, children, defaultValues, timezone, ...sectionHeaderProps } = props;

    const [ isPending, startTransition ] = useTransition();
    const [ state, setState ] = useState<ServerActionResult | undefined>();

    // Process the `defaultValues` to transform `ZonedDateTime`-compatible date and time notations
    // to DayJS instances, which we still require for the Material UI date components.
    // @see https://github.com/mui/mui-x/issues/4399
    const processedDefaultValues = useMemo(() => {
        if (!defaultValues)
            return undefined;

        let cachedTimezone = timezone;

        const processedDefaultValues: Record<string, dayjs.Dayjs | boolean | number | string> = {};
        for (const [ key, value ] of Object.entries(defaultValues)) {
            if (typeof value === 'string' && kTemporalZonedDateTimeRegexp.test(value)) {
                try {
                    cachedTimezone ??= Temporal.Now.timeZoneId();  // default to the local timezone

                    const zonedDateTime = Temporal.ZonedDateTime.from(value);
                    const localDateTime = zonedDateTime.withTimeZone(cachedTimezone);

                    processedDefaultValues[key] =
                        dayjs(localDateTime.toString({ timeZoneName: 'never' })).tz(cachedTimezone);

                    continue;

                } catch (error: any) {
                    console.error(`Invalid date/time string ("${value}"), ignoring.`, error);
                }
            }

            processedDefaultValues[key] = value;
        }

        return processedDefaultValues;

    }, [ defaultValues, timezone ]);

    // TODO: Do we need to preprocess `defaultValues` to translate ZonedDateTime-compatible formats
    // to ones that can be used by DayJS?

    const form = useForm({ defaultValues: processedDefaultValues });
    const router = useRouter();

    // For the values we pass to `reset()`, see the following react-hook-form documentation:
    // https://react-hook-form.com/docs/useform/reset

    useEffect(() => {
        form.reset(processedDefaultValues, {
            // DirtyFields and isDirty will remained, and only none dirty fields will be updated to
            // the latest rest value.
            keepDirtyValues: true,
        });
    }, [ processedDefaultValues, form ]);

    const handleSubmit = form.handleSubmit(async (data: unknown) => {
        await startTransition(async () => {
            if (!!data && typeof data === 'object') {
                for (const [ key, value ] of Object.entries(data)) {
                    if (dayjs.isDayjs(value))
                        (data as any)[key] = value.utc().toISOString();
                }
            }

            const result = await action(data);
            if (!!result.success) {
                form.reset({ /* fields */ }, {
                    // DirtyFields and isDirty will remained, and only none dirty fields will be
                    // updated to the latest rest value.
                    keepDirtyValues: true,

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
