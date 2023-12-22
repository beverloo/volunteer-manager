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

export class ActivitiesTable extends Table<DBConnection, 'ActivitiesTable'> {
    activityId = this.autogeneratedPrimaryKey('activity_id', 'int');
    activityFestivalId = this.column('activity_festival_id', 'int');
    activityTitle = this.column('activity_title', 'string');
    activityDescription = this.optionalColumnWithDefaultValue('activity_description', 'string');
    activityUrl = this.optionalColumnWithDefaultValue('activity_url', 'string');
    activityPrice = this.optionalColumnWithDefaultValue('activity_price', 'double');
    activityMaxVisitors = this.optionalColumnWithDefaultValue('activity_max_visitors', 'int');
    activityTypeAdultsOnly = this.column('activity_type_adults_only', 'int');
    activityTypeCompetition = this.column('activity_type_competition', 'int');
    activityTypeCosplay = this.column('activity_type_cosplay', 'int');
    activityTypeEvent = this.column('activity_type_event', 'int');
    activityTypeGameRoom = this.column('activity_type_game_room', 'int');
    activityTypeVideo = this.column('activity_type_video', 'int');
    activityVisible = this.column('activity_visible', 'int');
    activityVisibleReason = this.optionalColumnWithDefaultValue('activity_visible_reason', 'string');
    activityCreated = this.column('activity_created', 'localDateTime');
    activityUpdated = this.column('activity_updated', 'localDateTime');
    activityDeleted = this.optionalColumnWithDefaultValue('activity_deleted', 'localDateTime');

    constructor() {
        super('activities');
    }
}


