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
    ActivityType,
} from "../Types";
import {
    ZonedDateTime,
} from "../../Temporal";

export class ActivitiesTable extends Table<DBConnection, 'ActivitiesTable'> {
    activityId = this.autogeneratedPrimaryKey('activity_id', 'int');
    activityFestivalId = this.column('activity_festival_id', 'int');
    activityType = this.column<ActivityType>('activity_type', 'enum', 'ActivityType');
    activityTitle = this.column('activity_title', 'string');
    activityDescription = this.optionalColumnWithDefaultValue('activity_description', 'string');
    activityDescriptionWeb = this.optionalColumnWithDefaultValue('activity_description_web', 'string');
    activityRules = this.optionalColumnWithDefaultValue('activity_rules', 'string');
    activityUrl = this.optionalColumnWithDefaultValue('activity_url', 'string');
    activityPrice = this.optionalColumnWithDefaultValue('activity_price', 'double');
    activityHelpNeeded = this.column('activity_help_needed', 'int');
    activityMaxVisitors = this.optionalColumnWithDefaultValue('activity_max_visitors', 'int');
    /**
     * Only for internal activities
     */
    activityLocationId = this.optionalColumnWithDefaultValue('activity_location_id', 'int');
    activityTypeAdultsOnly = this.column('activity_type_adults_only', 'int');
    activityTypeCompetition = this.column('activity_type_competition', 'int');
    activityTypeCosplay = this.column('activity_type_cosplay', 'int');
    activityTypeEvent = this.column('activity_type_event', 'int');
    activityTypeGameRoom = this.column('activity_type_game_room', 'int');
    activityTypeVideo = this.column('activity_type_video', 'int');
    activityVisible = this.column('activity_visible', 'int');
    activityVisibleReason = this.optionalColumnWithDefaultValue('activity_visible_reason', 'string');
    activityRequestAssignee = this.optionalColumnWithDefaultValue('activity_request_assignee', 'int');
    activityRequestNotes = this.optionalColumnWithDefaultValue('activity_request_notes', 'string');
    activityCreated = this.column<ZonedDateTime>('activity_created', 'customLocalDateTime', 'dateTime', TemporalTypeAdapter);
    activityUpdated = this.column<ZonedDateTime>('activity_updated', 'customLocalDateTime', 'dateTime', TemporalTypeAdapter);
    activityDeleted = this.optionalColumnWithDefaultValue<ZonedDateTime>('activity_deleted', 'customLocalDateTime', 'dateTime', TemporalTypeAdapter);

    constructor() {
        super('activities');
    }
}

export const tActivities = new ActivitiesTable();

