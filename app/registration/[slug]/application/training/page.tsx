// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { contextForRegistrationPage } from '../../contextForRegistrationPage';

/**
 * The <EventApplicationTrainingPage> component serves the ability for users to select which
 * training session they would like to participate in, if any. Not all volunteers are eligible
 * to participate in the trainings.
 */
export default async function EventApplicationTrainingPage(props: NextRouterParams<'slug'>) {
    const context = await contextForRegistrationPage(props.params.slug);
    if (!context)
        notFound();

    return (
        <p>Hey {context.user?.firstName}</p>
    );
}
