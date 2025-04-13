// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Task } from '../Task';

/**
 * Task that imports ticket sales information from YourTicketProvider. The applicable event(s) will
 * automatically be selected based on their configuration, whereas frequency of data imports will
 * be automatically altered based on proximity to the festival.
 */
export class ImportYourTicketProviderTask extends Task {
    override async execute(): Promise<boolean> {
        return true;
    }
}
