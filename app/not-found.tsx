// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation'

import { Markdown } from '@components/Markdown';
import { RegistrationContentContainer } from '@app/registration/RegistrationContentContainer';
import { RegistrationLayout } from './registration/RegistrationLayout';
import { determineEnvironment } from '@lib/Environment';
import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { getStaticContent } from '@lib/Content';

/**
 * Root component shown when the requested page could not be found, or the signed in user does not
 * have access to it. This page explains the situation to the user.
 */
export default async function NotFoundPage() {
    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const { user } = await getAuthenticationContext();

    const content = await getStaticContent([ 'errors/404' ]);
    if (!content)
        notFound();

    return (
        <RegistrationLayout environment={environment}>
            <RegistrationContentContainer title={content.title} user={user}>
                <Markdown sx={{ p: 2 }}>{content.markdown}</Markdown>
            </RegistrationContentContainer>
        </RegistrationLayout>
    );
}

export const metadata: Metadata = {
    title: 'Page not found | AnimeCon Volunteering Teams',
};
