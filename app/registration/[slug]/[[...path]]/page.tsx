// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { RegistrationContent } from '../../RegistrationContent';
import { contextForRegistrationPage } from '../contextForRegistrationPage';
import { getContent } from '@lib/Content';

/**
 * The <EventContentPage> component displays arbitrary content for a particular event. Senior+
 * volunteers can freely create content as they see fit, which will be served by this component.
 */
export default async function EventContentPage(props: NextRouterParams<'slug', 'path'>) {
    const { path, slug } = props.params;

    const context = await contextForRegistrationPage(slug);
    if (!context)
        notFound();

    const { event, environment, registration } = context;

    const content = await getContent(environment.environmentName, event, path ?? []);
    if (!content)
        notFound();

    const backUrl = (path && path.length > 0) ? `/registration/${slug}` : undefined;
    return (
        <RegistrationContent backUrl={backUrl}
                             content={content}
                             event={event.toEventData()}
                             showRegistrationButton={!path || !path.length}
                             enableRegistrationButton={!registration} />
    );
}
