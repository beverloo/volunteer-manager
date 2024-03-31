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
                setting: 'schedule-day-view-start-time',
                type: 'string',
                defaultValue: '08:00',

                label: 'Schedule - start time (day view; HH:MM)',
                description: 'Time at which the day starts on schedule',
            },
            {
                setting: 'schedule-day-view-end-time',
                type: 'string',
                defaultValue: '27:30',

                label: 'Schedule - end time (day view; HH:MM)',
                description:
                    'Time at which the day ends on the schedule. May continue beyond midnight to ' +
                    'finish on the next day',
            },
            {
                setting: 'schedule-event-view-start-hours',
                type: 'number',
                defaultValue: 4,

                label: 'Schedule - start hours (event view)',
                description: 'Number of hours before opening that shifts can be scheduled',
            },
            {
                setting: 'schedule-event-view-end-hours',
                type: 'number',
                defaultValue: 4,

                label: 'Schedule - end hours (event view)',
                description: 'Number of hours after closing that shifts can be scheduled',
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
        'Schedule settings': [
            {
                setting: 'schedule-del-a-rie-advies',
                type: 'boolean',
                defaultValue: true,

                label: 'Del a Rie Advies',
                description: 'Whether the advice service should be enabled',
            },
            {
                setting: 'schedule-knowledge-base',
                type: 'boolean',
                defaultValue: true,

                label: 'Knowledge base',
                description: 'Whether the knowledge base should be enabled',
            },
            {
                setting: 'schedule-knowledge-base-search',
                type: 'boolean',
                defaultValue: true,

                label: 'Knowledge base (search)',
                description: 'Whether the search function should consider questions',
            },
            {
                setting: 'schedule-search-candidate-fuzziness',
                type: 'number',
                defaultValue: 0.04,

                label: 'Search result candidate (fuzziness)',
                description: 'Fuzziness [0-1] to apply to search result matching',
            },
            {
                setting: 'schedule-search-candidate-minimum-score',
                type: 'number',
                defaultValue: 0.37,

                label: 'Search result candidate (min score)',
                description: 'Minimum score [0-1] required for a candidate to be considered',
            },
            {
                setting: 'schedule-search-result-limit',
                type: 'number',
                defaultValue: 5,

                label: 'Search result limit (inline)',
                description: 'Maximum number of inline search results that will be shown',
            },
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
