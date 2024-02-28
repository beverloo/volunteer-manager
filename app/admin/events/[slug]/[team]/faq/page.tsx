// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { KnowledgeConfiguration } from './KnowledgeConfiguration';
import { KnowledgeList } from './KnowledgeList';
import { Privilege, can } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { createKnowledgeBaseScope } from '@app/admin/content/ContentScope';

/**
 * The FAQ provides a library of questions that we've received, or may receive from our visitors. It
 * is made available through the Volunteer Portal for all volunteers to be able to conveniently
 * answer any questions that they may receive from Staff, visitors and guests alike.
 */
export default async function EventTeamFaqPage(props: NextRouterParams<'slug' | 'team'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);
    if (!team.managesFaq)
        notFound();

    const accessConfiguration = can(user, Privilege.EventAdministrator);
    const enableAuthorLink = can(user, Privilege.VolunteerAdministrator);

    const scope = createKnowledgeBaseScope(event.id);

    return (
        <>
            <Section title="Knowledge base" subtitle={event.shortName}>
                <SectionIntroduction>
                    The <strong>knowledge base</strong> is a library of questions and answers we
                    expect from our guests, visitors and fellow volunteers, each with a prepared
                    answer.
                </SectionIntroduction>
                <KnowledgeList enableAuthorLink={enableAuthorLink} scope={scope} />
            </Section>
            { accessConfiguration &&
                <KnowledgeConfiguration /> }
        </>
    );
}
