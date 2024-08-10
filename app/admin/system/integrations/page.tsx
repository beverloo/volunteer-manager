// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { AnimeCon, type AnimeConSettings } from './AnimeCon';
import { Email, type EmailSettings } from './Email';
import { Google, type GoogleSettings } from './Google';
import { StatusHeader } from './StatusHeader';
import { Twilio } from './Twilio';
import { VertexAI, type VertexAISettings } from './VertexAI';
import { VertexSupportedModels } from '@lib/integrations/vertexai/VertexSupportedModels';
import { readSettings } from '@lib/Settings';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import type { TwilioSettings } from '@lib/integrations/twilio/TwilioClient';

/**
 * The Integrations page lists settings and information regarding the third party services that the
 * Volunteer Manager integrates with.
 */
export default async function IntegrationsPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'system.internals.settings',
    });

    const settings = await readSettings([
        // AnimeCon:
        'integration-animecon-api-endpoint',
        'integration-animecon-auth-endpoint',
        'integration-animecon-client-id',
        'integration-animecon-client-secret',
        'integration-animecon-username',
        'integration-animecon-password',
        'integration-animecon-scopes',

        // E-mail:
        'integration-email-smtp-hostname',
        'integration-email-smtp-port',
        'integration-email-smtp-username',
        'integration-email-smtp-password',

        // Google:
        'integration-google-apikey',
        'integration-google-credentials',
        'integration-google-location',
        'integration-google-project-id',

        // Google Vertex AI:
        'integration-vertex-model',
        'integration-vertex-temperature',
        'integration-vertex-token-limit',
        'integration-vertex-top-k',
        'integration-vertex-top-p',

        // Twilio:
        'integration-twilio-account-auth-token',
        'integration-twilio-account-sid',
        'integration-twilio-messaging-sid-sms',
        'integration-twilio-messaging-sid-whatsapp',
        'integration-twilio-region',
    ]);

    const animeConSettings: AnimeConSettings = {
        apiEndpoint: settings['integration-animecon-api-endpoint'] ?? '',
        authEndpoint: settings['integration-animecon-auth-endpoint'] ?? '',
        clientId: settings['integration-animecon-client-id'] ?? '',
        clientSecret: settings['integration-animecon-client-secret'] ?? '',
        username: settings['integration-animecon-username'] ?? '',
        password: settings['integration-animecon-password'] ?? '',
        scopes: settings['integration-animecon-scopes'] ?? '',
    };

    const emailSettings: EmailSettings = {
        hostname: settings['integration-email-smtp-hostname'] ?? '',
        port: settings['integration-email-smtp-port'] ?? 587,
        username: settings['integration-email-smtp-username'] ?? '',
        password: settings['integration-email-smtp-password'] ?? '',
    };

    const googleSettings: GoogleSettings = {
        apiKey: settings['integration-google-apikey'] ?? '',
        credential: settings['integration-google-credentials'] ?? '',
        location: settings['integration-google-location'] ?? '',
        projectId: settings['integration-google-project-id'] ?? '',
    };

    const twilioSettings: TwilioSettings = {
        accountSid: settings['integration-twilio-account-sid'] ?? '',
        accountAuthToken: settings['integration-twilio-account-auth-token'] ?? '',
        messagingSidSms: settings['integration-twilio-messaging-sid-sms'] ?? '',
        messagingSidWhatsapp: settings['integration-twilio-messaging-sid-whatsapp'] ?? '',
        region: settings['integration-twilio-region'],
    };

    const vertexSettings: VertexAISettings = {
        model:
            settings['integration-vertex-model'] ?? VertexSupportedModels['gemini-1.5-flash-001'],
        temperature: settings['integration-vertex-temperature'] ?? 0.25,
        tokenLimit: settings['integration-vertex-token-limit'] ?? 256,
        topK: settings['integration-vertex-top-k'] ?? 40,
        topP: settings['integration-vertex-top-p'] ?? 0.8,
    };

    return (
        <>
            <StatusHeader />
            <AnimeCon settings={animeConSettings} />
            <Email settings={emailSettings} />
            <Google settings={googleSettings} />
            <VertexAI settings={vertexSettings} />
            <Twilio settings={twilioSettings} />
        </>
    );
}

export const metadata: Metadata = {
    title: 'Integrations | AnimeCon Volunteer Manager',
};
