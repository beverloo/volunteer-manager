// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Paper from '@mui/material/Paper';

import { FormGrid, type FormGridProps } from './FormGrid';
import { SectionHeader, type SectionHeaderProps } from './SectionHeader';

/**
 * Props accepted by the <FormGridSection> component.
 */
export type FormGridSectionProps =
    FormGridProps & (Omit<SectionHeaderProps, 'sx'> | { noHeader: true });

/**
 * The <FormGridSection> component represents a visually separated section of a page in the admin
 * area. The component is specialised for sections that contain form fields, and all its children
 * are expected to be <Grid> components, or fragments containing <Grid> components therein.
 *
 * Form-specific handling contained within this component is deferred to <FormGrid>, as well as the
 * <FormProvider> component that underpins that.
 */
export function FormGridSection(props: React.PropsWithChildren<FormGridSectionProps>) {
    const formGridProps: FormGridProps = {
        action: props.action,
        callToAction: props.callToAction,
        defaultValues: props.defaultValues,
        timezone: props.timezone,
    };

    if ('noHeader' in props) {
        return (
            <Paper sx={{ p: 2 }}>
                <FormGrid {...formGridProps}>{props.children}</FormGrid>
            </Paper>
        );
    }

    const sectionHeaderProps: Omit<SectionHeaderProps, 'action' | 'sx'> = {
        headerAction: props.headerAction,
        icon: props.icon,
        permission: props.permission,
        title: props.title,
        subtitle: props.subtitle,
    };

    return (
        <Paper sx={{ p: 2 }}>
            { !('noHeader' in sectionHeaderProps) &&
                <SectionHeader {...sectionHeaderProps} sx={{ pb: 2 }} /> }
            <FormGrid {...formGridProps}>{props.children}</FormGrid>
        </Paper>
    );
}
