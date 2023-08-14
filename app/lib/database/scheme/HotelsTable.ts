/**
 * DO NOT EDIT:
 *
 * This file has been auto-generated from database schema using ts-sql-codegen.
 * Any changes will be overwritten.
 */
import { Table } from "ts-sql-query/Table";
import type { DBConnection } from "../Connection.ts";

export class HotelsTable extends Table<DBConnection, 'HotelsTable'> {
    hotelId = this.primaryKey('hotel_id', 'int');
    eventId = this.column('event_id', 'int');
    hotelName = this.columnWithDefaultValue('hotel_name', 'string');
    hotelDescription = this.columnWithDefaultValue('hotel_description', 'string');
    hotelRoomName = this.columnWithDefaultValue('hotel_room_name', 'string');
    hotelRoomPeople = this.columnWithDefaultValue('hotel_room_people', 'int');
    hotelRoomPrice = this.columnWithDefaultValue('hotel_room_price', 'int');
    hotelRoomVisible = this.columnWithDefaultValue('hotel_room_visible', 'int');

    constructor() {
        super('hotels');
    }
}


