// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { AiPromptContext, type AiPromptContextProps } from './AiPromptContext';
import { AiPromptPersonality } from './AiPromptPersonality';
import { Privilege } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { readSettings } from '@lib/Settings';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The AI page contains the prompt configuration used for our use of Generative AI throughout the
 * volunteer portal. The page is protected behind a special permission.
 */
export default async function AiPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'system.internals.ai',
    });

    // Settings to load for this page, shared across the different displays.
    const settings = await readSettings([
        // <AiPromptPersonality>:
        'gen-ai-personality',

        // <AiPromptContext>:
        'gen-ai-prompt-approve-volunteer',
        'gen-ai-prompt-cancel-participation',
        'gen-ai-prompt-change-team',
        'gen-ai-prompt-reinstate-participation',
        'gen-ai-prompt-reject-volunteer',
    ]);

    // <AiPromptContext> prompts:
    const prompts: AiPromptContextProps['prompts'] = [
        {
            label: 'Application (approve)',
            prompt: settings['gen-ai-prompt-approve-volunteer'] ?? '',
            setting: 'gen-ai-prompt-approve-volunteer',
        },
        {
            label: 'Application (reject)',
            prompt: settings['gen-ai-prompt-reject-volunteer'] ?? '',
            setting: 'gen-ai-prompt-reject-volunteer',
        },
        {
            label: ' Participation (change team)',
            prompt: settings['gen-ai-prompt-change-team'] ?? '',
            setting: 'gen-ai-prompt-change-team',
        },
        {
            label: 'Participation (cancel)',
            prompt: settings['gen-ai-prompt-cancel-participation'] ?? '',
            setting: 'gen-ai-prompt-cancel-participation',
        },
        {
            label: 'Participation (reinstate)',
            prompt: settings['gen-ai-prompt-reinstate-participation'] ?? '',
            setting: 'gen-ai-prompt-reinstate-participation',
        },
    ];

    return (
        <>
            <Section title="Generative AI">
                <SectionIntroduction>
                    While the AnimeCon Volunteer Manager uses generative AI to draft messages to
                    volunteers, leads will always have the ability to overwrite them. Personality is
                    shared across the individual prompts, which are specific to context that will be
                    added programmatically.
                </SectionIntroduction>
            </Section>
            <AiPromptPersonality personality={settings['gen-ai-personality'] ?? ''} />
            <AiPromptContext prompts={prompts} />
        </>
    );
}

export const metadata: Metadata = {
    title: 'Generative AI | AnimeCon Volunteer Manager',
};

