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
    ZonedDateTime,
} from "../../Temporal";

export class TeamsTable extends Table<DBConnection, 'TeamsTable'> {
    teamId = this.autogeneratedPrimaryKey('team_id', 'int');
    teamSlug = this.column('team_slug', 'string');
    teamName = this.column('team_name', 'string');
    teamPlural = this.column('team_plural', 'string');
    teamTitle = this.column('team_title', 'string');
    teamDescription = this.column('team_description', 'string');
    teamEnvironment = this.column('team_environment', 'string');
    teamEnvironmentId = this.optionalColumnWithDefaultValue('team_environment_id', 'int');
    teamInviteKey = this.column('team_invite_key', 'string');
    teamFlagEnableScheduling = this.columnWithDefaultValue('team_flag_enable_scheduling', 'int');
    teamFlagManagesContent = this.columnWithDefaultValue('team_flag_manages_content', 'int');
    teamFlagManagesFaq = this.columnWithDefaultValue('team_flag_manages_faq', 'int');
    teamFlagManagesFirstAid = this.columnWithDefaultValue('team_flag_manages_first_aid', 'int');
    teamFlagManagesSecurity = this.columnWithDefaultValue('team_flag_manages_security', 'int');
    teamFlagProgramRequests = this.columnWithDefaultValue('team_flag_program_requests', 'int');
    teamFlagRequestConfirmation = this.columnWithDefaultValue('team_flag_request_confirmation', 'int');
    teamColourDarkTheme = this.column('team_colour_dark_theme', 'string');
    teamColourLightTheme = this.column('team_colour_light_theme', 'string');
    teamDeleted = this.optionalColumnWithDefaultValue<ZonedDateTime>('team_deleted', 'customLocalDateTime', 'dateTime', TemporalTypeAdapter);

    constructor() {
        super('teams');
    }
}

export const tTeams = new TeamsTable();

