// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextPageParams } from '@lib/NextRouterParams';
import { ContentCreate } from '@app/admin/content/ContentCreate';
import { ContentList } from '@app/admin/content/ContentList';
import { Privilege, can } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { createEventScope } from '@app/admin/content/ContentScope';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The <EventContentPage> page lists the content that's associated with a particular team and a
 * particular event. It includes a mixture of required (fixed) content and dynamic content.
 */
export default async function EventContentPage(props: NextPageParams<'event' | 'team'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);

    const enableAuthorLink = can(user, Privilege.VolunteerAdministrator);
    const pathPrefix = `/registration/${event.slug}/`;
    const scope = createEventScope(event.id, team.id);

    return (
        <>
            <Section title="Pages" subtitle={team._environment}>
                <ContentList enableAuthorLink={enableAuthorLink} pathPrefix={pathPrefix}
                             scope={scope} />
            </Section>
            <Section title="Create a new page">
                <SectionIntroduction>
                    You can create a new page for the <strong>{team.name}</strong>, which will
                    immediately be published on <strong>{team._environment}</strong>.
                </SectionIntroduction>
                <ContentCreate pathPrefix={pathPrefix} scope={scope} />
            </Section>
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Content');
