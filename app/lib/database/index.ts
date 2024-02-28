// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { CreateDateStringFragment, CreateDateTimeStringFragment, CreateTimestampStringFragment }
    from './DateTimeStringColumns';

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
import { SubscriptionsTable } from './scheme/SubscriptionsTable';
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
import { WhatsappMessagesTable } from './scheme/WhatsappMessagesTable';

// Export instances of each of the above table types that are for the app to use. Naming convention
// matches that proposed by `ts-sql-query`, i.e. `FooTable` becomes `tFoo`.
export const tActivities = new ActivitiesTable;
export const tActivitiesAreas = new ActivitiesAreasTable;
export const tActivitiesLocations = new ActivitiesLocationsTable;
export const tActivitiesLogs = new class extends ActivitiesLogsTable {
    mutationDateString = this.virtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.mutationDate));
}
export const tActivitiesTimeslots = new ActivitiesTimeslotsTable;
export const tContent = new class extends ContentTable {
    revisionDateString = this.virtualColumnFromFragment(
        'string', CreateTimestampStringFragment(this.revisionDate));
}
export const tEvents = new class extends EventsTable {
    eventStartTimeString = this.virtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.eventStartTime));
    eventEndTimeString = this.virtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.eventEndTime));
    eventRefundsStartTimeString = this.optionalVirtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.eventRefundsStartTime));
    eventRefundsEndTimeString = this.optionalVirtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.eventRefundsEndTime));
}
export const tEventsTeams = new EventsTeamsTable;
export const tExports = new class extends ExportsTable {
    exportCreatedDateString = this.virtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.exportCreatedDate));
    exportExpirationDateString = this.virtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.exportExpirationDate));
}
export const tExportsLogs = new class extends ExportsLogsTable {
    accessDateString = this.virtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.accessDate));
}
export const tHotels = new HotelsTable;
export const tHotelsAssignments = new HotelsAssignmentsTable;
export const tHotelsBookings = new class extends HotelsBookingsTable {
    bookingCheckInString = this.virtualColumnFromFragment(
        'string', CreateDateStringFragment(this.bookingCheckIn));
    bookingCheckOutString = this.virtualColumnFromFragment(
        'string', CreateDateStringFragment(this.bookingCheckOut));
}
export const tHotelsPreferences = new class extends HotelsPreferencesTable {
    hotelDateCheckInString = this.optionalVirtualColumnFromFragment(
        'string', CreateDateStringFragment(this.hotelDateCheckIn));
    hotelDateCheckOutString = this.optionalVirtualColumnFromFragment(
        'string', CreateDateStringFragment(this.hotelDateCheckOut));
    hotelPreferencesUpdatedString = this.virtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.hotelPreferencesUpdated));
}
export const tLogs = new class extends LogsTable {
    logDateString = this.virtualColumnFromFragment(
        'string', CreateTimestampStringFragment(this.logDate));
}
export const tNardo = new class extends NardoTable {
    nardoAuthorDateString = this.virtualColumnFromFragment(
        'string', CreateTimestampStringFragment(this.nardoAuthorDate));
};
export const tOutbox = new class extends OutboxTable {
    outboxTimestampString = this.virtualColumnFromFragment(
        'string', CreateTimestampStringFragment(this.outboxTimestamp));
}
export const tRefunds = new class extends RefundsTable {
    refundRequestedString = this.virtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.refundRequested));
    refundConfirmedString = this.optionalVirtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.refundConfirmed));
}
export const tRetention = new RetentionTable;
export const tRoles = new RolesTable;
export const tSchedule = new ScheduleTable;
export const tSettings = new SettingsTable;
export const tShifts = new ShiftsTable;
export const tStorage = new StorageTable;
export const tSubscriptions = new SubscriptionsTable;
export const tTasks = new class extends TasksTable {
    taskScheduledDateString = this.virtualColumnFromFragment(
        'string', CreateTimestampStringFragment(this.taskScheduledDate));
}
export const tTeamsRoles = new TeamsRolesTable;
export const tTeams = new TeamsTable;
export const tTrainings = new class extends TrainingsTable {
    trainingStartString = this.virtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.trainingStart));
    trainingEndString = this.virtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.trainingEnd));
}
export const tTrainingsAssignments = new class extends TrainingsAssignmentsTable {
    assignmentUpdatedString = this.optionalVirtualColumnFromFragment(
        'string', CreateTimestampStringFragment(this.assignmentUpdated));
    preferenceUpdatedString = this.optionalVirtualColumnFromFragment(
        'string', CreateTimestampStringFragment(this.preferenceUpdated));
}
export const tTrainingsExtra = new class extends TrainingsExtraTable {
    trainingExtraBirthdateString = this.optionalVirtualColumnFromFragment(
        'string', CreateDateStringFragment(this.trainingExtraBirthdate));
}
export const tUsersAuth = new UsersAuthTable;
export const tUsersEvents = new class extends UsersEventsTable {
    registrationDateString = this.optionalVirtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.registrationDate));
    preferencesUpdatedString = this.optionalVirtualColumnFromFragment(
        'string', CreateDateTimeStringFragment(this.preferencesUpdated));
}
export const tUsersPasskeys = new UsersPasskeysTable;
export const tUsersSettings = new UsersSettingsTable;
export const tUsers = new class extends UsersTable {
    birthdateString = this.optionalVirtualColumnFromFragment(
        'string', CreateDateStringFragment(this.birthdate));
    name = this.displayName.valueWhenNull(this.firstName.concat(' ').concat(this.lastName));
}
export const tVendors = new VendorsTable;
export const tWhatsAppMessages = new WhatsappMessagesTable;

// Export the database connection pool as the default export from this file, for convenient access
// to the database throughout the server-side of the Volunteer Manager.
export { globalConnection as default } from './Connection';
