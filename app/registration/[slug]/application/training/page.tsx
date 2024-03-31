// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Box from '@mui/material/Box';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Markdown } from '@components/Markdown';
import { Privilege, can } from '@lib/auth/Privileges';
import { TrainingConfirmation } from './TrainingConfirmation';
import { TrainingPreferences } from './TrainingPreferences';
import { contextForRegistrationPage } from '../../contextForRegistrationPage';
import { generatePortalMetadataFn } from '../../../generatePortalMetadataFn';
import { getStaticContent } from '@lib/Content';
import { getTrainingOptions } from './getTrainingOptions';

/**
 * The <EventApplicationTrainingPage> component serves the ability for users to select which
 * training session they would like to participate in, if any. Not all volunteers are eligible
 * to participate in the trainings.
 */
export default async function EventApplicationTrainingPage(props: NextPageParams<'slug'>) {
    const context = await contextForRegistrationPage(props.params.slug);
    if (!context || !context.registration || !context.user)
        notFound();  // the event does not exist, or the volunteer is not signed in

    const { environment, event, registration, user } = context;

    const eligible = registration.trainingEligible;
    const enabled = registration.trainingAvailable || can(user, Privilege.EventTrainingManagement);
    const preferences = registration.training;

    if ((!eligible || !enabled) && !(!!preferences && !!preferences.confirmed))
        notFound();  // the volunteer is not eligible to participate in the training

    const trainingOptions = await getTrainingOptions(event.eventId);
    const content = await getStaticContent([ 'registration', 'application', 'training' ], {
        firstName: user.firstName,
    });

    // ---------------------------------------------------------------------------------------------
    // Logic pertaining to <TrainingPreferences>
    // ---------------------------------------------------------------------------------------------
    const readOnly = !!preferences && !!preferences.confirmed;

    return (
        <Box sx={{ p: 2 }}>
            { content && <Markdown>{content.markdown}</Markdown> }
            { (!!registration.training && !!registration.training.confirmed) &&
                <TrainingConfirmation timezone={event.timezone}
                                      training={registration.training} /> }
            <TrainingPreferences environment={environment.environmentName} eventSlug={event.slug}
                                 readOnly={readOnly} training={registration.training}
                                 trainingOptions={trainingOptions} />
            <MuiLink component={Link} href={`/registration/${event.slug}/application`}>
                « Back to your registration
            </MuiLink>
        </Box>
    );
}

export const generateMetadata = generatePortalMetadataFn('Training preferences');
