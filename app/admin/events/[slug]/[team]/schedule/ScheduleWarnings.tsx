// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { ExpandableSection } from '@app/admin/components/ExpandableSection';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';

/**
 * Props accepted by the <ScheduleWarnings> component.
 */
export interface ScheduleWarningsProps {
    /**
     * Whether the warnings should be expanded by default.
     */
    defaultExpanded?: boolean;
}

/**
 * The <ScheduleWarnings> component displays the warnings associated with the current schedule. It
 * sources its information from the schedule context, which keeps everything as up-to-date as it
 * can do. The section will exist even when no warnings could be found.
 */
export function ScheduleWarnings(props: ScheduleWarningsProps) {
    // TODO: Source the `warningCount` from the context
    // TODO: Display a "success" banner when no warnings exist.
    // TODO: Display a list of warnings when warnings do exist.
    const warningCount = 0;

    const icon = !!warningCount ? <WarningAmberIcon color="warning" />
                                : <TaskAltIcon color="success" />;

    return (
        <ExpandableSection defaultExpanded={props.defaultExpanded} title="Warnings" icon={icon}
                           setting="user-admin-schedule-expand-warnings"
                           subtitle={ !!warningCount ? `${warningCount}` : undefined }>
            <SectionIntroduction important>
                Warnings are not supported yet.
            </SectionIntroduction>
        </ExpandableSection>
    );
}
