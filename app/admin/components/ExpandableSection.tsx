// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { type default as React, useCallback } from 'react';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

import type { UserSetting } from '@lib/UserSettings';
import { SectionHeader, type SectionHeaderProps } from './SectionHeader';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <ExpandableSection> component, that are directly owned by the component.
 */
export type ExpandableSectionProps = SectionHeaderProps & {
    /**
     * Whether the section should be expanded by default.
     */
    defaultExpanded?: boolean;

    /**
     * The icon that should be shown in the expandable section's header, if any.
     */
    icon?: React.ReactNode;

    /**
     * The setting that should be updated when expandable state changes.
     */
    setting?: UserSetting;
}

/**
 * The <ExpandableSection> component represents a visually separated section of a page in the
 * administration area that, unlike <Section>, can be hidden and shown dynamically.
 */
export function ExpandableSection(props: React.PropsWithChildren<ExpandableSectionProps>) {
    const { children, defaultExpanded, icon, ...sectionHeaderProps } = props;

    const handleStoreSetting = useCallback((event: unknown, expanded: boolean) => {
        if (!props.setting)
            return;  // no setting to update

        callApi('post', '/api/auth/settings', { [props.setting]: expanded }).catch(error =>
            console.warn(`Unable to store a user setting (${props.setting}): ${error}`));

    }, [ props.setting ]);

    return (
        <Paper component={Accordion} defaultExpanded={defaultExpanded} disableGutters
               onChange={handleStoreSetting}
               sx={{ '&::before': { backgroundColor: 'transparent' } }}>
            <AccordionSummary expandIcon={ <ExpandMoreIcon /> }>
                <Stack direction="row" alignItems="center" spacing={2}>
                    {icon}
                    <SectionHeader {...sectionHeaderProps} sx={{ mb: 0 }} />
                </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ paddingTop: 0 }}>
                <Stack direction="column" spacing={2}>
                    {props.children}
                </Stack>
            </AccordionDetails>
        </Paper>
    );
}
