// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextRouterParams } from '@lib/NextRouterParams';
import { CollapsableSection } from '@app/admin/components/CollapsableSection';
import { Privilege, can } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { generateEventMetadataFn } from '../../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * This page displays an individual shift, its configuration, time allocation and warnings. The
 * actual volunteers cannot be adjusted; this is something that has to be done on the schedule page.
 */
export default async function EventTeamShiftPage(props: NextRouterParams<'slug' | 'team' | 'id'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);

    const readOnly = !can(user, Privilege.EventShiftManagement);
    const warnings: any[] = [ ];

    return (
        <>
            <Section title="Shift">
                <SectionIntroduction important>
                    The shifts tool has not been implemented yet.
                </SectionIntroduction>
            </Section>
            <Section title="Request">
                <SectionIntroduction important>
                    The shifts tool has not been implemented yet.
                </SectionIntroduction>
            </Section>
            <CollapsableSection in={!!warnings.length} title="Shift warnings">
                <SectionIntroduction important>
                    The shifts tool has not been implemented yet.
                </SectionIntroduction>
            </CollapsableSection>
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Shifts');
