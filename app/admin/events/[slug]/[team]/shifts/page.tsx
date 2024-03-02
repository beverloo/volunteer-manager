// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRouterParams } from '@lib/NextRouterParams';
import { CollapsableSection } from '@app/admin/components/CollapsableSection';
import { Privilege, can } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { ShiftTable } from './ShiftTable';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The shifts page allows leadership to define the individual tasks and work items that can be
 * assigned to our volunteers. Shifts linked to program entries will automatically warn when they
 * end up out of sync.
 */
export default async function EventTeamShiftsPage(props: NextRouterParams<'slug' | 'team'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);

    // TODO: Mutable list with all the shifts that exist during the convention.
    // TODO: Box with warnings regarding the shifts (e.g. out-of-sync entries).

    const readOnly = !can(user, Privilege.EventShiftManagement);
    const warnings: any[] = [ ];

    return (
        <>
            <Section title="Shifts" subtitle={team.name}>
                <ShiftTable event={event.slug} team={team.slug} readOnly={readOnly} />
            </Section>
            <CollapsableSection in={!!warnings.length} title="Shift warnings">
                <SectionIntroduction important>
                    The shifts tool has not been implemented yet.
                </SectionIntroduction>
            </CollapsableSection>
            { !readOnly &&
                <Section title="Create a new shift" privilege={Privilege.EventShiftManagement}>
                    <SectionIntroduction important>
                        The shifts tool has not been implemented yet.
                    </SectionIntroduction>
                </Section> }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Shifts');
