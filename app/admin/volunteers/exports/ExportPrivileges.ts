// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { ExportType } from '@lib/database/Types';
import { Privilege } from '@lib/auth/Privileges';

/**
 * Additional privilege required in order to create or access exports of a certain type.
 */
export const kExportTypePrivilege: { [key in ExportType]: Privilege } = {
    [ExportType.Credits]: Privilege.EventApplicationManagement,
    [ExportType.Refunds]: Privilege.Refunds,
    [ExportType.Trainings]: Privilege.EventTrainingManagement,
    [ExportType.Volunteers]: Privilege.EventApplicationManagement,
};
