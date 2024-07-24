// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { AccessControl } from '@lib/auth/AccessControl';
import type { User } from '@lib/auth/User';
import { ExportType } from '@lib/database/Types';

import { kAnyEvent, kAnyTeam } from '@lib/auth/AccessControl';

/**
 * Returns whether the visitor has access to exports of the given `type`.
 */
export function hasAccessToExport(type: ExportType, access: AccessControl): boolean {
    switch (type) {
        case ExportType.Credits:
        case ExportType.Volunteers:
            return access.can('event.applications', 'read', {
                event: kAnyEvent,
                team: kAnyTeam,
            });

        case ExportType.Refunds:
            return access.can('event.refunds', { event: kAnyEvent });

        case ExportType.Trainings:
            return access.can('event.trainings', { event: kAnyEvent });
    }

    throw new Error(`Unrecognised export type: "${type}"`);
}
