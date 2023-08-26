// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { VertexPromptHumour, VertexPromptIdentity, VertexPromptTone }
    from './VertexPromptBuilder';

import db, { tSettings, tUsersSettings } from '@lib/database';

/**
 * Represents the settings that can be stored and retrieved in the Volunteer Manager that are keyed
 * on a per user basis. These are complementary to regular settings, and regular settings can be
 * used to configure default values for these.
 */
type UserSettingsMap = {
    // ---------------------------------------------------------------------------------------------
    // Google Vertex AI settings
    // ---------------------------------------------------------------------------------------------

    'vertex-personality-humour': VertexPromptHumour,
    'vertex-personality-identity': VertexPromptIdentity,
    'vertex-personality-tone': VertexPromptTone,
};

/**
 * Reads the user setting with the given `setting`, or `undefined` when it cannot be loaded and no
 * default has been configured. This function will end up issuing a database call.
 */
export async function readUserSetting<T extends keyof UserSettingsMap>(userId: number, setting: T)
    : Promise<UserSettingsMap[T] | undefined>
{
    return (await readUserSettings(userId, [ setting ]))[setting];
}

/**
 * Reads the settings whose names are included in the given `settings` for the user identified by
 * the given `userId`. An object will be returned with the setting values, or `undefined` when they
 * cannot be loaded or have no defaults. This function will end up issuing a database call.
 */
export async function readUserSettings<T extends keyof UserSettingsMap>(
    userId: number, settings: T[]): Promise<{ [k in T]: UserSettingsMap[k] | undefined }>
{
    const usersSettingsJoin = tUsersSettings.forUseInLeftJoin();
    const storedValues = await db.selectFrom(tSettings)
        .leftJoin(usersSettingsJoin)
            .on(usersSettingsJoin.settingName.equals(tSettings.settingName))
            .and(usersSettingsJoin.userId.equals(userId))
        .where(tSettings.settingName.in(settings))
        .select({
            name: tSettings.settingName,
            value: usersSettingsJoin.settingValue.valueWhenNull(tSettings.settingValue)
        })
        .executeSelectMany();

    const result: { [k in T]: UserSettingsMap[k] | undefined } = { /* empty */ } as any;
    for (const { name, value } of storedValues)
        result[name as keyof typeof result] = JSON.parse(value);

    return result;
}

/**
 * Writes the setting with the given `setting` to the database for the given `userId`, to be
 * associated with the given `value` (which may be `undefined`). This function will end up issuing
 * a database call.
 */
export async function writeUserSetting<T extends keyof UserSettingsMap>(
    userId: number, setting: T, value?: UserSettingsMap[T]): Promise<void>
{
    await writeUserSettings(userId, { [setting]: value } as any);
}

/**
 * Writes the given `settings` to the database. Each key in `settings` must be a valid setting with
 * the appropriate type, or `undefined`. This function works by deleting all keys from the database
 * and then creating new rows for the settings with values, all within a transaction.
 */
export async function writeUserSettings<T extends keyof UserSettingsMap>(
    userId: number, settings: { [k in T]: UserSettingsMap[k] | undefined }) : Promise<void>
{
    const dbInstance = db;
    await dbInstance.transaction(async () => {
        const keysToDelete: T[] = [];
        const keysToInsert: { userId: number, settingName: string, settingValue: string }[] = [];

        for (const [ setting, value ] of Object.entries(settings)) {
            keysToDelete.push(setting as T);

            if (typeof value !== 'undefined') {
                keysToInsert.push({
                    userId,
                    settingName: setting,
                    settingValue: JSON.stringify(value)
                });
            }
        }

        // Delete stored settings that no longer should have a value.
        if (keysToDelete.length) {
            await dbInstance.deleteFrom(tUsersSettings)
                .where(tUsersSettings.settingName.in(keysToDelete))
                    .and(tUsersSettings.userId.equals(userId))
                .executeDelete(/* min= */ 0, /* max= */ keysToDelete.length);
        }

        // Insert new rows for stored settings that do have a value.
        if (keysToInsert.length) {
            await dbInstance.insertInto(tUsersSettings)
                .values(keysToInsert)
                .executeInsert(/* min= */ 0, /* max= */ keysToInsert.length);
        }
    });
}
