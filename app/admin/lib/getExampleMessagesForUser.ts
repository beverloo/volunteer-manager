// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod/v4';

import { readUserSetting, writeUserSetting } from '@lib/UserSettings';

/**
 * Gets the example messages that have been stored for the given `userId`. An array of the messages
 * will be returned. Invalid messages will be silently ignored.
 */
export async function getExampleMessagesForUser(userId: number): Promise<string[]> {
    const exampleMessagesStr = await readUserSetting(userId, 'user-ai-example-messages');
    let exampleMessages: string[] = [ /* empty */ ];

    if (!!exampleMessagesStr) {
        try {
            const exampleMessagesArray = JSON.parse(exampleMessagesStr);
            exampleMessages = z.array(z.string()).parse(exampleMessagesArray);

        } catch (error: any) {
            console.error(`Invalid example messages for user ${userId}`);
        }
    }

    return exampleMessages;
}

/**
 * Writes the given example `messages` to the database associated with the given `userId`.
 */
export async function setExampleMessagesForUser(userId: number, messages: string[]) {
    await writeUserSetting(userId, 'user-ai-example-messages', JSON.stringify(messages));
}
