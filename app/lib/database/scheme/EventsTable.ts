// @ts-nocheck
/* eslint-disable quotes, max-len */
/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection";
import {
    EventAvailabilityStatus,
} from "../Types";

export class EventsTable extends Table<DBConnection, 'EventsTable'> {
    eventId = this.autogeneratedPrimaryKey('event_id', 'int');
    eventName = this.column('event_name', 'string');
    eventShortName = this.column('event_short_name', 'string');
    eventSlug = this.column('event_slug', 'string');
    eventHidden = this.columnWithDefaultValue('event_hidden', 'int');
    eventStartTime = this.column('event_start_time', 'localDateTime');
    eventEndTime = this.column('event_end_time', 'localDateTime');
    eventRefundsStartTime = this.optionalColumnWithDefaultValue('event_refunds_start_time', 'localDateTime');
    eventRefundsEndTime = this.optionalColumnWithDefaultValue('event_refunds_end_time', 'localDateTime');
    eventAvailabilityStatus = this.column<EventAvailabilityStatus>('event_availability_status', 'enum', 'EventAvailabilityStatus');
    eventLocation = this.optionalColumnWithDefaultValue('event_location', 'string');
    eventTimezone = this.column('event_timezone', 'string');
    eventHotelRoomForm = this.optionalColumnWithDefaultValue('event_hotel_room_form', 'string');
    eventFestivalId = this.optionalColumnWithDefaultValue('event_festival_id', 'int');
    eventIdentityId = this.optionalColumnWithDefaultValue('event_identity_id', 'int');
    publishAvailability = this.columnWithDefaultValue('publish_availability', 'int');
    publishHotels = this.columnWithDefaultValue('publish_hotels', 'int');
    publishRefunds = this.columnWithDefaultValue('publish_refunds', 'int');
    publishTrainings = this.columnWithDefaultValue('publish_trainings', 'int');

    constructor() {
        super('events');
    }
}


