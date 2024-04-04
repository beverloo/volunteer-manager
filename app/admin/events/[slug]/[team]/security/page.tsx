// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Privilege } from '@lib/auth/Privileges';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { Section } from '@app/admin/components/Section';
import { VendorTable } from '../first-aid/VendorTable';
import { VendorTeam } from '@lib/database/Types';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { readSetting } from '@lib/Settings';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The security team (normally supporting the Stewards) is responsible for the physical security of
 * our visitors and volunteers. They're a vendor team, and therefore not considered volunteers.
 */
export default async function EventTeamSecurityPage(props: NextPageParams<'slug' | 'team'>) {
    const { event, team } = await verifyAccessAndFetchPageInfo(
        props.params, Privilege.EventSupportingTeams);

    if (!team.managesSecurity)
        notFound();

    const roleSetting = await readSetting('vendor-security-roles') ?? 'Security';
    const roles = roleSetting.split(',').map(role => role.trim());

    return (
        <>
            <Section title="Security" subtitle={event.shortName}>
                <SectionIntroduction>
                    This page allows you to manage the <strong>security vendor team</strong>. The
                    information shared on this page is exclusively used in the scheduling app.
                </SectionIntroduction>
                <VendorTable event={event.slug} team={VendorTeam.Security} roles={roles} />
            </Section>
            { /* TODO: Timeline */ }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Security');
