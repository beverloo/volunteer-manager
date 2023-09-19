// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { ContentTable } from './scheme/ContentTable';
import { EventsTable } from './scheme/EventsTable';
import { EventsTeamsTable } from './scheme/EventsTeamsTable';
import { HotelsTable } from './scheme/HotelsTable';
import { HotelsAssignmentsTable } from './scheme/HotelsAssignmentsTable';
import { HotelsBookingsTable } from './scheme/HotelsBookingsTable';
import { HotelsPreferencesTable } from './scheme/HotelsPreferencesTable';
import { LogsTable } from './scheme/LogsTable';
import { RolesTable } from './scheme/RolesTable';
import { ScheduleTable } from './scheme/ScheduleTable';
import { ServicesLogsTable } from './scheme/ServicesLogsTable';
import { ServicesTable } from './scheme/ServicesTable';
import { SettingsTable } from './scheme/SettingsTable';
import { ShiftsTable } from './scheme/ShiftsTable';
import { StorageTable } from './scheme/StorageTable';
import { TeamsRolesTable } from './scheme/TeamsRolesTable';
import { TeamsTable } from './scheme/TeamsTable';
import { TrainingsTable } from './scheme/TrainingsTable';
import { TrainingsExtraTable } from './scheme/TrainingsExtraTable';
import { UsersAuthTable } from './scheme/UsersAuthTable';
import { UsersEventsTable } from './scheme/UsersEventsTable';
import { UsersSettingsTable } from './scheme/UsersSettingsTable';
import { UsersTable } from './scheme/UsersTable';

// Export instances of each of the above table types that are for the app to use. Naming convention
// matches that proposed by `ts-sql-query`, i.e. `FooTable` becomes `tFoo`.
export const tContent = new ContentTable;
export const tEvents = new EventsTable;
export const tEventsTeams = new EventsTeamsTable;
export const tHotels = new HotelsTable;
export const tHotelsAssignments = new HotelsAssignmentsTable;
export const tHotelsBookings = new HotelsBookingsTable;
export const tHotelsPreferences = new HotelsPreferencesTable;
export const tLogs = new LogsTable;
export const tRoles = new RolesTable;
export const tSchedule = new ScheduleTable;
export const tServicesLogs = new ServicesLogsTable;
export const tServices = new ServicesTable;
export const tSettings = new SettingsTable;
export const tShifts = new ShiftsTable;
export const tStorage = new StorageTable;
export const tTeamsRoles = new TeamsRolesTable;
export const tTeams = new TeamsTable;
export const tTrainings = new TrainingsTable;
export const tTrainingsExtra = new TrainingsExtraTable;
export const tUsersAuth = new UsersAuthTable;
export const tUsersEvents = new UsersEventsTable;
export const tUsersSettings = new UsersSettingsTable;
export const tUsers = new UsersTable;

// Export the database connection pool as the default export from this file, for convenient access
// to the database throughout the server-side of the Volunteer Manager.
export { globalConnection as default } from './Connection';
