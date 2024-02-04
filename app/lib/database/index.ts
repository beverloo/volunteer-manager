// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { withDateTimeStringColumns } from './withDateTimeStringColumns';

import { ActivitiesAreasTable } from './scheme/ActivitiesAreasTable';
import { ActivitiesLocationsTable } from './scheme/ActivitiesLocationsTable';
import { ActivitiesLogsTable } from './scheme/ActivitiesLogsTable';
import { ActivitiesTable } from './scheme/ActivitiesTable';
import { ActivitiesTimeslotsTable } from './scheme/ActivitiesTimeslotsTable';
import { ContentTable } from './scheme/ContentTable';
import { EventsTable } from './scheme/EventsTable';
import { EventsTeamsTable } from './scheme/EventsTeamsTable';
import { ExportsLogsTable } from './scheme/ExportsLogsTable';
import { ExportsTable } from './scheme/ExportsTable';
import { HotelsTable } from './scheme/HotelsTable';
import { HotelsAssignmentsTable } from './scheme/HotelsAssignmentsTable';
import { HotelsBookingsTable } from './scheme/HotelsBookingsTable';
import { HotelsPreferencesTable } from './scheme/HotelsPreferencesTable';
import { LogsTable } from './scheme/LogsTable';
import { NardoTable } from './scheme/NardoTable';
import { OutboxTable } from './scheme/OutboxTable';
import { RefundsTable } from './scheme/RefundsTable';
import { RetentionTable } from './scheme/RetentionTable';
import { RolesTable } from './scheme/RolesTable';
import { ScheduleTable } from './scheme/ScheduleTable';
import { SettingsTable } from './scheme/SettingsTable';
import { ShiftsTable } from './scheme/ShiftsTable';
import { StorageTable } from './scheme/StorageTable';
import { TasksTable } from './scheme/TasksTable';
import { TeamsRolesTable } from './scheme/TeamsRolesTable';
import { TeamsTable } from './scheme/TeamsTable';
import { TrainingsTable } from './scheme/TrainingsTable';
import { TrainingsAssignmentsTable } from './scheme/TrainingsAssignmentsTable';
import { TrainingsExtraTable } from './scheme/TrainingsExtraTable';
import { UsersAuthTable } from './scheme/UsersAuthTable';
import { UsersEventsTable } from './scheme/UsersEventsTable';
import { UsersPasskeysTable } from './scheme/UsersPasskeysTable';
import { UsersSettingsTable } from './scheme/UsersSettingsTable';
import { UsersTable } from './scheme/UsersTable';
import { VendorsTable } from './scheme/VendorsTable';

// Export instances of each of the above table types that are for the app to use. Naming convention
// matches that proposed by `ts-sql-query`, i.e. `FooTable` becomes `tFoo`.
export const tActivities = new ActivitiesTable;
export const tActivitiesAreas = new ActivitiesAreasTable;
export const tActivitiesLocations = new ActivitiesLocationsTable;
export const tActivitiesLogs = new ActivitiesLogsTable;
export const tActivitiesTimeslots = new ActivitiesTimeslotsTable;
export const tContent = new ContentTable;
export const tEvents = new EventsTable;
export const tEventsTeams = new EventsTeamsTable;
export const tExports = new ExportsTable;
export const tExportsLogs = new ExportsLogsTable;
export const tHotels = new HotelsTable;
export const tHotelsAssignments = new HotelsAssignmentsTable;
export const tHotelsBookings = withDateTimeStringColumns(new HotelsBookingsTable);
export const tHotelsPreferences = withDateTimeStringColumns(new HotelsPreferencesTable);
export const tLogs = new LogsTable;
export const tNardo = new NardoTable;
export const tOutbox = new OutboxTable;
export const tRefunds = new RefundsTable;
export const tRetention = new RetentionTable;
export const tRoles = new RolesTable;
export const tSchedule = new ScheduleTable;
export const tSettings = new SettingsTable;
export const tShifts = new ShiftsTable;
export const tStorage = new StorageTable;
export const tTasks = withDateTimeStringColumns(new TasksTable);
export const tTeamsRoles = new TeamsRolesTable;
export const tTeams = new TeamsTable;
export const tTrainings = new TrainingsTable;
export const tTrainingsAssignments = withDateTimeStringColumns(new TrainingsAssignmentsTable);
export const tTrainingsExtra = withDateTimeStringColumns(new TrainingsExtraTable);
export const tUsersAuth = new UsersAuthTable;
export const tUsersEvents = new UsersEventsTable;
export const tUsersPasskeys = new UsersPasskeysTable;
export const tUsersSettings = new UsersSettingsTable;
export const tUsers = withDateTimeStringColumns(new UsersTable);
export const tVendors = new VendorsTable;

// Export the database connection pool as the default export from this file, for convenient access
// to the database throughout the server-side of the Volunteer Manager.
export { globalConnection as default } from './Connection';
