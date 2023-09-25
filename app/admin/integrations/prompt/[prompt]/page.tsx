// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Privilege, can } from '@lib/auth/Privileges';
import { PromptPersonalityPage } from './PromptPersonalityPage';
import { readSetting } from '@lib/Settings';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The prompt page allows an administrator to test the result of a particular prompt against the
 * different personalities that the volunteer manager supports.
 */
export default async function IntegrationsPromptPage(props: NextRouterParams<'prompt'>) {
    const { user } = await requireAuthenticationContext();
    if (!can(user, Privilege.VolunteerAdministrator))
        notFound();

    const requestedPrompt = await readSetting(`integration-prompt-${props.params.prompt}` as any);
    if (!requestedPrompt)
        notFound();

    return <PromptPersonalityPage promptName={props.params.prompt} prompt={requestedPrompt}
                                  user={user} />;
}

export const metadata: Metadata = {
    title: 'Vertex AI Prompts | AnimeCon Volunteer Manager',
};
