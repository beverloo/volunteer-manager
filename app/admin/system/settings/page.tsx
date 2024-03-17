// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import Alert from '@mui/material/Alert';

import { Privilege } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { SettingSection, type ConfigurableSetting } from './SettingSection';
import { readSettings, type Setting } from '@lib/Settings';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The Settings page lists configurable settings part of the AnimeCon Volunteer Manager that are not
 * exposed through other parts of the system.
 */
export default async function IntegrationsPage() {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemAdministrator,
    });

    // The configuration for settings contains the individual settings, the data types, and the
    // default values in case none could be retrieved from the database. The page's content will be
    // dynamically composed based on this configuration.
    const settingsConfiguration: { [k: string]: ConfigurableSetting[] } = {
        'Display settings': [
            {
                setting: 'display-check-in-rate-seconds',
                type: 'number',
                defaultValue: 60,

                label: 'Check-in interval',
                description:
                    'Every how many seconds should displays "phone home" for updated information?',
            },
            {
                setting: 'display-confirm-volume-change',
                type: 'boolean',
                defaultValue: false,

                label: 'Confirm volume changes',
                description:
                    'When set, a sound will play to confirm volume changes on the device.',
            },
            {
                setting: 'display-dev-environment-link',
                type: 'string',
                defaultValue: '',

                label: 'Dev environment link',
                description:
                    'When set, a menu item will be included linking through to this URL.',
            },
            {
                setting: 'display-max-time-since-check-in-days',
                type: 'number',
                defaultValue: 90,

                label: 'Maximum time since check-in',
                description:
                    'After how many days of inactivity should we stop considering a display?',
            }
        ],
        'Event settings': [
            {
                setting: 'availability-max-event-duration-minutes',
                type: 'number',
                defaultValue: 180,

                label: 'Availability - duration cutoff',
                description:
                    'What is the longest event, in minutes, to consider for availability ' +
                    'preferences?',
            },
            {
                setting: 'availability-time-step-minutes',
                type: 'number',
                defaultValue: 15,

                label: 'Availability - time step',
                description:
                    'Time step, in minutes, defining granularity of events in availability ' +
                    'exceptions.',
            },
            {
                setting: 'retention-number-of-events-to-consider',
                type: 'number',
                defaultValue: 2,

                label: 'Retention - historical events',
                description: 'How many events should be considered for retention planning?',
            },
            {
                setting: 'schedule-time-step-minutes',
                type: 'number',
                defaultValue: 15,

                label: 'Schedule - time step',
                description:
                    'Time step, in minutes, defining granularity of shifts in the scheduling tools.'
            }
        ],
    };

    // In two steps, gather, then inject all the configured values included in the configuration.
    {
        const settings = new Set<Setting>();
        for (const entries of Object.values(settingsConfiguration)) {
            for (let index = 0; index < entries.length; ++index)
                settings.add(entries[index].setting);
        }

        const settingValues = await readSettings([ ...settings ]);
        for (const [ title, entries ] of Object.entries(settingsConfiguration)) {
            for (let index = 0; index < entries.length; ++index)
                settingsConfiguration[title][index].value = settingValues[entries[index].setting];
        }
    }

    return (
        <>
            <Section title="Volunteer Manager Settings">
                <Alert severity="info">
                    The following settings may be dynamically configured to alter the Volunteer
                    Manager's behaviour. While you can change them to anything you want, certain
                    values may cause functionality to break or behave in an unintended manner.
                </Alert>
            </Section>
            { Object.entries(settingsConfiguration).map(([ title, settings ]) =>
                <SettingSection key={title} title={title} settings={settings} /> )}
        </>
    );
}

export const metadata: Metadata = {
    title: 'Settings | AnimeCon Volunteer Manager',
};
