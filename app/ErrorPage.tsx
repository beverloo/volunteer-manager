// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation'

import { Markdown } from '@components/Markdown';
import { RegistrationContentContainer } from '@app/registration/RegistrationContentContainer';
import { RegistrationLayout } from './registration/RegistrationLayout';
import { determineEnvironment } from '@lib/Environment';
import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { getStaticContent } from '@lib/Content';

/**
 * Props accepted by the ErrorPage component.
 */
interface ErrorPageProps {
    /**
     * The HTTP status code matching the error that was thrown.
     */
    statusCode: 401 | 403 | 404;
}

/**
 * Root component shown when an error has occurred, as indicated by the given status code in the
 * `props`. No detailed information is provided.
 */
export async function ErrorPage(props: ErrorPageProps) {
    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const { user } = await getAuthenticationContext();

    const content = await getStaticContent([ `errors/${props.statusCode}` ]);
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
