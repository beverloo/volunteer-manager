// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import db, { tSettings } from '@lib/database';

/**
 * Represents the settings that can be stored and retrieved in the Volunteer Manager. These are all
 * stored in the database, but typing is done exclusively client-side.
 */
type SettingsMap = {
    // ---------------------------------------------------------------------------------------------
    // Generative AI settings
    // ---------------------------------------------------------------------------------------------

    // Personality:
    'gen-ai-personality': string;

    // Prompts:
    'gen-ai-prompt-approve-volunteer': string;
    'gen-ai-prompt-cancel-participation': string;
    'gen-ai-prompt-change-team': string;
    'gen-ai-prompt-reinstate-participation': string;
    'gen-ai-prompt-reject-volunteer': string;

    // ---------------------------------------------------------------------------------------------
    // Integration settings
    // ---------------------------------------------------------------------------------------------

    // AnimeCon:
    'integration-animecon-api-endpoint': string;
    'integration-animecon-auth-endpoint': string;
    'integration-animecon-client-id': string;
    'integration-animecon-client-secret': string;
    'integration-animecon-username': string;
    'integration-animecon-password': string;
    'integration-animecon-scopes': string;

    // E-mail:
    'integration-email-smtp-hostname': string;
    'integration-email-smtp-port': number;
    'integration-email-smtp-username': string;
    'integration-email-smtp-password': string;

    // Google:
    'integration-google-credentials': string;
    'integration-google-location': string;
    'integration-google-project-id': string;

    // Google Vertex AI:
    'integration-vertex-model': 'text-bison' | 'text-bison@001';
    'integration-vertex-temperature': number;
    'integration-vertex-token-limit': number;
    'integration-vertex-top-k': number;
    'integration-vertex-top-p': number;

    // ---------------------------------------------------------------------------------------------
    // UserSettings defaults
    // ---------------------------------------------------------------------------------------------

    // No user settings exist yet.
};

/**
 * Type containing all setting names known to the system.
 */
export type Setting = keyof SettingsMap;

/**
 * Reads the setting with the given `setting`, or `undefined` when it cannot be loaded. This
 * function will end up issuing a database call.
 */
export async function readSetting<T extends keyof SettingsMap>(setting: T)
    : Promise<SettingsMap[T] | undefined>
{
    return (await readSettings([ setting ]))[setting];
}

/**
 * Reads the settings whose names are included in the given `settings`. An object will be returned
 * with the setting values, or `undefined` when they cannot be loaded. This function will end up
 * issuing a database call.
 */
export async function readSettings<T extends keyof SettingsMap>(settings: T[])
    : Promise<{ [k in T]: SettingsMap[k] | undefined }>
{
    const storedValues = await db.selectFrom(tSettings)
        .where(tSettings.settingName.in(settings))
        .select({
            name: tSettings.settingName,
            value: tSettings.settingValue,
        })
        .executeSelectMany();

    const result: { [k in T]: SettingsMap[k] | undefined } = { /* empty */ } as any;
    for (const { name, value } of storedValues)
        result[name as keyof typeof result] = JSON.parse(value);

    return result;
}

/**
 * Writes the setting with the given `setting` to the database, to be associated with the given
 * `value` (which may be `undefined`). This function will end up issuing a database call.
 */
export async function writeSetting<T extends keyof SettingsMap>(setting: T, value?: SettingsMap[T])
    : Promise<void>
{
    await writeSettings({ [setting]: value } as any);
}

/**
 * Writes the given `settings` to the database. Each key in `settings` must be a valid setting with
 * the appropriate type, or `undefined`. This function works by deleting all keys from the database
 * and then creating new rows for the settings with values, all within a transaction.
 */
export async function writeSettings<T extends keyof SettingsMap>(
    settings: { [k in T]: SettingsMap[k] | undefined }) : Promise<void>
{
    const dbInstance = db;
    await dbInstance.transaction(async () => {
        const keysToDelete: T[] = [];
        const keysToInsert: { settingName: string, settingValue: string }[] = [];

        for (const [ setting, value ] of Object.entries(settings)) {
            keysToDelete.push(setting as T);

            if (typeof value !== 'undefined')
                keysToInsert.push({ settingName: setting, settingValue: JSON.stringify(value) });
        }

        // Delete stored settings that no longer should have a value.
        if (keysToDelete.length) {
            await dbInstance.deleteFrom(tSettings)
                .where(tSettings.settingName.in(keysToDelete))
                .executeDelete(/* min= */ 0, /* max= */ keysToDelete.length);
        }

        // Insert new rows for stored settings that do have a value.
        if (keysToInsert.length) {
            await dbInstance.insertInto(tSettings)
                .values(keysToInsert)
                .executeInsert(/* min= */ 0, /* max= */ keysToInsert.length);
        }
    });
}
