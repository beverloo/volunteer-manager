// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { Privilege, can } from '@lib/auth/Privileges';
import { ContentCreate } from './ContentCreate';
import { ContentList } from './ContentList';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '../components/SectionIntroduction';
import { createGlobalScope } from './ContentScope';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ContentPage> component lists the global content, which then, in turn, may be edited and
 * deleted as applicable. This includes the privacy policy, e-mail messages, and so on.
 */
export default async function ContentPage() {
    const { user } = await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemContentAccess,
    });

    const enableAuthorLink = can(user, Privilege.VolunteerAdministrator);
    const scope = createGlobalScope();

    return (
        <>
            <Section title="Pages">
                <ContentList enableAuthorLink={enableAuthorLink} scope={scope} />
            </Section>
            <Section title="Create a new page">
                <SectionIntroduction>
                    You can create new <strong>global content</strong>. These pages will however not
                    automatically be published, and rely on code changes.
                </SectionIntroduction>
                <ContentCreate scope={scope} />
            </Section>
        </>
    );
}

export const metadata: Metadata = {
    title: 'Content | AnimeCon Volunteer Manager',
};
