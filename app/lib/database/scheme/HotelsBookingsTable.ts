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
    TemporalTypeAdapter,
} from "../TemporalTypeAdapter";
import {
    PlainDate,
} from "../../Temporal";

export class HotelsBookingsTable extends Table<DBConnection, 'HotelsBookingsTable'> {
    bookingId = this.autogeneratedPrimaryKey('booking_id', 'int');
    eventId = this.column('event_id', 'int');
    bookingHotelId = this.optionalColumnWithDefaultValue('booking_hotel_id', 'int');
    bookingCheckIn = this.columnWithDefaultValue<PlainDate>('booking_check_in', 'customLocalDate', 'date', TemporalTypeAdapter);
    bookingCheckOut = this.columnWithDefaultValue<PlainDate>('booking_check_out', 'customLocalDate', 'date', TemporalTypeAdapter);
    bookingConfirmed = this.columnWithDefaultValue('booking_confirmed', 'int');
    bookingVisible = this.columnWithDefaultValue('booking_visible', 'int');

    constructor() {
        super('hotels_bookings');
    }
}

export const tHotelsBookings = new HotelsBookingsTable();

