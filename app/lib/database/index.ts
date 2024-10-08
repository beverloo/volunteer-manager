// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { ActivitiesAreasTable } from './scheme/ActivitiesAreasTable';
import { ActivitiesLocationsTable } from './scheme/ActivitiesLocationsTable';
import { ActivitiesLogsTable } from './scheme/ActivitiesLogsTable';
import { ActivitiesTable } from './scheme/ActivitiesTable';
import { ActivitiesTimeslotsTable } from './scheme/ActivitiesTimeslotsTable';
import { ContentCategoryTable } from './scheme/ContentCategoryTable';
import { ContentTable } from './scheme/ContentTable';
import { DisplaysRequestsTable } from './scheme/DisplaysRequestsTable';
import { DisplaysTable } from './scheme/DisplaysTable';
import { EnvironmentsTable } from './scheme/EnvironmentsTable';
import { ErrorLogsTable } from './scheme/ErrorLogsTable';
import { EventsDeadlinesTable } from './scheme/EventsDeadlinesTable';
import { EventsSalesTable } from './scheme/EventsSalesTable';
import { EventsTable } from './scheme/EventsTable';
import { EventsTeamsTable } from './scheme/EventsTeamsTable';
import { ExportsLogsTable } from './scheme/ExportsLogsTable';
import { ExportsTable } from './scheme/ExportsTable';
import { FeedbackTable } from './scheme/FeedbackTable';
import { HotelsTable } from './scheme/HotelsTable';
import { HotelsAssignmentsTable } from './scheme/HotelsAssignmentsTable';
import { HotelsBookingsTable } from './scheme/HotelsBookingsTable';
import { HotelsPreferencesTable } from './scheme/HotelsPreferencesTable';
import { LogsTable } from './scheme/LogsTable';
import { NardoTable } from './scheme/NardoTable';
import { OutboxEmailTable } from './scheme/OutboxEmailTable';
import { OutboxTwilioTable } from './scheme/OutboxTwilioTable';
import { RefundsTable } from './scheme/RefundsTable';
import { RetentionTable } from './scheme/RetentionTable';
import { RolesTable } from './scheme/RolesTable';
import { ScheduleTable } from './scheme/ScheduleTable';
import { SettingsTable } from './scheme/SettingsTable';
import { ShiftsCategoriesTable } from './scheme/ShiftsCategoriesTable';
import { ShiftsTable } from './scheme/ShiftsTable';
import { StorageTable } from './scheme/StorageTable';
import { SubscriptionsPublicationsTable } from './scheme/SubscriptionsPublicationsTable';
import { SubscriptionsTable } from './scheme/SubscriptionsTable';
import { TasksTable } from './scheme/TasksTable';
import { TeamsRolesTable } from './scheme/TeamsRolesTable';
import { TeamsTable } from './scheme/TeamsTable';
import { TrainingsTable } from './scheme/TrainingsTable';
import { TrainingsAssignmentsTable } from './scheme/TrainingsAssignmentsTable';
import { TrainingsExtraTable } from './scheme/TrainingsExtraTable';
import { TwilioWebhookCallsTable } from './scheme/TwilioWebhookCallsTable';
import { UsersAuthTable } from './scheme/UsersAuthTable';
import { UsersEventsTable } from './scheme/UsersEventsTable';
import { UsersPasskeysTable } from './scheme/UsersPasskeysTable';
import { UsersSettingsTable } from './scheme/UsersSettingsTable';
import { UsersTable } from './scheme/UsersTable';
import { VendorsScheduleTable } from './scheme/VendorsScheduleTable';
import { VendorsTable } from './scheme/VendorsTable';

// Export instances of each of the above table types that are for the app to use. Naming convention
// matches that proposed by `ts-sql-query`, i.e. `FooTable` becomes `tFoo`.
export const tActivities = new ActivitiesTable;
export const tActivitiesAreas = new ActivitiesAreasTable;
export const tActivitiesLocations = new ActivitiesLocationsTable;
export const tActivitiesLogs = new ActivitiesLogsTable;
export const tActivitiesTimeslots = new ActivitiesTimeslotsTable;
export const tContentCategories = new ContentCategoryTable;
export const tContent = new ContentTable;
export const tDisplays = new DisplaysTable;
export const tDisplaysRequests = new DisplaysRequestsTable;
export const tEnvironments = new EnvironmentsTable;
export const tErrorLogs = new ErrorLogsTable;
export const tEventsDeadlines = new EventsDeadlinesTable;
export const tEvents = new EventsTable;
export const tEventsSales = new EventsSalesTable;
export const tEventsTeams = new EventsTeamsTable;
export const tExports = new ExportsTable;
export const tExportsLogs = new ExportsLogsTable;
export const tFeedback = new FeedbackTable;
export const tHotels = new HotelsTable;
export const tHotelsAssignments = new HotelsAssignmentsTable;
export const tHotelsBookings = new HotelsBookingsTable;
export const tHotelsPreferences = new HotelsPreferencesTable;
export const tLogs = new LogsTable;
export const tNardo = new NardoTable;
export const tOutboxEmail = new OutboxEmailTable;
export const tOutboxTwilio = new OutboxTwilioTable;
export const tRefunds = new RefundsTable;
export const tRetention = new RetentionTable;
export const tRoles = new RolesTable;
export const tSchedule = new ScheduleTable;
export const tSettings = new SettingsTable;
export const tShiftsCategories = new ShiftsCategoriesTable;
export const tShifts = new ShiftsTable;
export const tStorage = new StorageTable;
export const tSubscriptions = new SubscriptionsTable;
export const tSubscriptionsPublications = new SubscriptionsPublicationsTable;
export const tTasks = new TasksTable;
export const tTeamsRoles = new TeamsRolesTable;
export const tTeams = new TeamsTable;
export const tTrainings = new TrainingsTable;
export const tTrainingsAssignments = new TrainingsAssignmentsTable;
export const tTrainingsExtra = new TrainingsExtraTable;
export const tTwilioWebhookCalls = new TwilioWebhookCallsTable;
export const tUsersAuth = new UsersAuthTable;
export const tUsersEvents = new UsersEventsTable;
export const tUsersPasskeys = new UsersPasskeysTable;
export const tUsersSettings = new UsersSettingsTable;
export const tUsers = new class extends UsersTable {
    name = this.displayName.valueWhenNull(this.firstName.concat(' ').concat(this.lastName));
}
export const tVendorsSchedule = new VendorsScheduleTable;
export const tVendors = new VendorsTable;

// Export the database connection pool as the default export from this file, for convenient access
// to the database throughout the server-side of the Volunteer Manager.
export { globalConnection as default } from './Connection';
