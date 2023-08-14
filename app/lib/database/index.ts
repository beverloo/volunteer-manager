// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type DatabasePrimitive, kDatabase } from './Database';

import { ContentTable } from './scheme/ContentTable';
import { EventsTable } from './scheme/EventsTable';
import { EventsTeamsTable } from './scheme/EventsTeamsTable';
import { HotelsTable } from './scheme/HotelsTable';
import { LogsTable } from './scheme/LogsTable';
import { RolesTable } from './scheme/RolesTable';
import { ScheduleTable } from './scheme/ScheduleTable';
import { ServicesLogsTable } from './scheme/ServicesLogsTable';
import { ServicesTable } from './scheme/ServicesTable';
import { ShiftsTable } from './scheme/ShiftsTable';
import { StorageTable } from './scheme/StorageTable';
import { TeamsRolesTable } from './scheme/TeamsRolesTable';
import { TeamsTable } from './scheme/TeamsTable';
import { UsersAuthTable } from './scheme/UsersAuthTable';
import { UsersEventsTable } from './scheme/UsersEventsTable';
import { UsersTable } from './scheme/UsersTable';

// Export instances of each of the above table types that are for the app to use. Naming convention
// matches that proposed by `ts-sql-query`, i.e. `FooTable` becomes `tFoo`.
export const tContent = new ContentTable;
export const tEvents = new EventsTable;
export const tEventsTeams = new EventsTeamsTable;
export const tHotels = new HotelsTable;
export const tLogs = new LogsTable;
export const tRoles = new RolesTable;
export const tSchedule = new ScheduleTable;
export const tServicesLogs = new ServicesLogsTable;
export const tServices = new ServicesTable;
export const tShifts = new ShiftsTable;
export const tStorage = new StorageTable;
export const tTeamsRoles = new TeamsRolesTable;
export const tTeams = new TeamsTable;
export const tUsersAuth = new UsersAuthTable;
export const tUsersEvents = new UsersEventsTable;
export const tUsers = new UsersTable;

// Export the database connection pool as the default export from this file, for convenient access
// to the database throughout the server-side of the Volunteer Manager.
export { kConnection as default } from './Connection';

// The implementation of the `sql` string template literal created by Malte for Vercel, modified
// to work with the |kDatabase| environment we use in this project.
//
// The implementation was made publicly available under an Apache 2 license, compatible with MIT.
// - https://github.com/vercel/storage/blob/main/packages/postgres/src/index.ts
// - https://github.com/vercel/storage/blob/main/packages/postgres/src/sql-template.ts
export function sql(strings: TemplateStringsArray, ...parameters: DatabasePrimitive[]) {
    if (!isTemplateStringsArray(strings) || !Array.isArray(parameters))
        throw new Error('Cannot call sql() as a function, use it as a tagged string template.');

    let query = strings[0] ?? '';
    for (let i = 1; i < strings.length; ++i)
        query += `?${strings[i] ?? ''}`;

    return kDatabase.query(query, parameters);
}

function isTemplateStringsArray(strings: unknown): strings is TemplateStringsArray {
    return Array.isArray(strings) && 'raw' in strings && Array.isArray(strings.raw);
}
