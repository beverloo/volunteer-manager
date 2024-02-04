// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Table } from 'ts-sql-query/Table';
import { extractColumnNamesFrom, extractWritableColumnNamesFrom } from 'ts-sql-query/extras/utils';

import type { ZonedDateTime } from '@lib/Temporal';
import { DBConnection, useMockConnection } from './Connection';
import { TasksTable } from './scheme/TasksTable';
import { TemporalTypeAdapter } from './TemporalTypeAdapter';
import { withDateTimeStringColumns } from './withDateTimeStringColumns';
import db from './index';

describe('withDateTimeStrings', () => {
    useMockConnection();

    it('is able to inject string fields for table types', () => {
        const table = new TasksTable;
        expect(table).toHaveProperty('taskParentTaskId');
        expect(table).not.toHaveProperty('taskParentTaskIdString');
        expect(table).toHaveProperty('taskScheduledDate');
        expect(table).not.toHaveProperty('taskScheduledDateString');  // <--

        const tableWithDateTimeStringColumns = withDateTimeStringColumns(table);
        expect(tableWithDateTimeStringColumns).toHaveProperty('taskParentTaskId');
        expect(tableWithDateTimeStringColumns).not.toHaveProperty('taskParentTaskIdString');
        expect(tableWithDateTimeStringColumns).toHaveProperty('taskScheduledDate');
        expect(tableWithDateTimeStringColumns).toHaveProperty('taskScheduledDateString');  // <--
    });

    it('does not appear in the enumeration of writable columns', () => {
        const table = new TasksTable;
        {
            const columnNames = extractColumnNamesFrom(table);
            const writableColumnNames = extractWritableColumnNamesFrom(table);

            expect(columnNames).toContain('taskParentTaskId');
            expect(columnNames).not.toContain('taskParentTaskIdString');
            expect(columnNames).toContain('taskScheduledDate');
            expect(columnNames).not.toContain('taskScheduledDateString');

            expect(writableColumnNames).toContain('taskParentTaskId');
            expect(writableColumnNames).not.toContain('taskParentTaskIdString');
            expect(writableColumnNames).toContain('taskScheduledDate');
            expect(writableColumnNames).not.toContain('taskScheduledDateString');
        }

        const tableWithDateTimeStringColumns = withDateTimeStringColumns(table);
        {
            const columnNames = extractColumnNamesFrom(tableWithDateTimeStringColumns);
            const writableColumnNames =
                extractWritableColumnNamesFrom(tableWithDateTimeStringColumns);

            expect(columnNames).toContain('taskParentTaskId');
            expect(columnNames).not.toContain('taskParentTaskIdString');
            expect(columnNames).toContain('taskScheduledDate');
            expect(columnNames).toContain('taskScheduledDateString');  // <--

            expect(writableColumnNames).toContain('taskParentTaskId');
            expect(writableColumnNames).not.toContain('taskParentTaskIdString');
            expect(writableColumnNames).toContain('taskScheduledDate');
            expect(writableColumnNames).not.toContain('taskScheduledDateString');  // <--
        }
    });

    it('generates somewhat sensible SQL for the virtual string columns', async () => {
        const table = new class extends Table<DBConnection, 'TestTable'> {
            // -------------------------------------------------------------------------------------
            // DATE:
            // -------------------------------------------------------------------------------------

            optionalDefaultDateColumn = this.optionalColumnWithDefaultValue<ZonedDateTime>(
                'date_default_optional', 'customComparable', 'date', TemporalTypeAdapter);
            optionalDateColumn = this.optionalColumn<ZonedDateTime>(
                'date_optional', 'customComparable', 'date', TemporalTypeAdapter);
            requiredDefaultDateColumn = this.columnWithDefaultValue<ZonedDateTime>(
                'date_default_required', 'customComparable', 'date', TemporalTypeAdapter);
            requiredDateColumn = this.column<ZonedDateTime>(
                'date_required', 'customComparable', 'date', TemporalTypeAdapter);

            // -------------------------------------------------------------------------------------
            // DATETIME:
            // -------------------------------------------------------------------------------------

            optionalDefaultDateTimeColumn = this.optionalColumnWithDefaultValue<ZonedDateTime>(
                'date_time_default_optional', 'customComparable', 'dateTime', TemporalTypeAdapter);
            optionalDateTimeColumn = this.optionalColumn<ZonedDateTime>(
                'date_time_optional', 'customComparable', 'dateTime', TemporalTypeAdapter);
            requiredDefaultDateTimeColumn = this.columnWithDefaultValue<ZonedDateTime>(
                'date_time_default_required', 'customComparable', 'dateTime', TemporalTypeAdapter);
            requiredDateTimeColumn = this.column<ZonedDateTime>(
                'date_time_required', 'customComparable', 'dateTime', TemporalTypeAdapter);

            // -------------------------------------------------------------------------------------
            // TIME:
            // -------------------------------------------------------------------------------------

            optionalDefaultTimeColumn = this.optionalColumnWithDefaultValue<ZonedDateTime>(
                'time_default_optional', 'customComparable', 'time', TemporalTypeAdapter);
            optionalTimeColumn = this.optionalColumn<ZonedDateTime>(
                'time_optional', 'customComparable', 'time', TemporalTypeAdapter);
            requiredDefaultTimeColumn = this.columnWithDefaultValue<ZonedDateTime>(
                'time_default_required', 'customComparable', 'time', TemporalTypeAdapter);
            requiredTimeColumn = this.column<ZonedDateTime>(
                'time_required', 'customComparable', 'time', TemporalTypeAdapter);

            // -------------------------------------------------------------------------------------
            // TIMESTAMP:
            // -------------------------------------------------------------------------------------

            optionalDefaultTimestampColumn = this.optionalColumnWithDefaultValue<ZonedDateTime>(
                'timestamp_default_optional', 'customComparable', 'timestamp', TemporalTypeAdapter);
            optionalTimestampColumn = this.optionalColumn<ZonedDateTime>(
                'timestamp_optional', 'customComparable', 'timestamp', TemporalTypeAdapter);
            requiredDefaultTimestampColumn = this.columnWithDefaultValue<ZonedDateTime>(
                'timestamp_default_required', 'customComparable', 'timestamp', TemporalTypeAdapter);
            requiredTimestampColumn = this.column<ZonedDateTime>(
                'timestamp_required', 'customComparable', 'timestamp', TemporalTypeAdapter);

            constructor() {
                super('tbl');
            }
        };

        const tableWithDateTimeStringColumns = withDateTimeStringColumns(table);

        // -----------------------------------------------------------------------------------------
        // DATE:
        // -----------------------------------------------------------------------------------------
        {
            const columnMapping = {
                'date_default_optional':
                    tableWithDateTimeStringColumns.optionalDefaultDateColumnString,
                'date_optional': tableWithDateTimeStringColumns.optionalDateColumnString,
                'date_default_required':
                    tableWithDateTimeStringColumns.requiredDefaultDateColumnString,
                'date_required': tableWithDateTimeStringColumns.requiredDateColumnString,
            };

            for (const [ name, column ] of Object.entries(columnMapping)) {
                const query = db.selectFrom(tableWithDateTimeStringColumns)
                    .selectOneColumn(column)
                    .query();

                expect(query).toEqual(
                    `select date_format(${name}, "%Y-%m-%d") as result from tbl`);
            }
        }

        // -----------------------------------------------------------------------------------------
        // DATETIME:
        // -----------------------------------------------------------------------------------------
        {
            const columnMapping = {
                'date_time_default_optional':
                    tableWithDateTimeStringColumns.optionalDefaultDateTimeColumnString,
                'date_time_optional': tableWithDateTimeStringColumns.optionalDateTimeColumnString,
                'date_time_default_required':
                    tableWithDateTimeStringColumns.requiredDefaultDateTimeColumnString,
                'date_time_required': tableWithDateTimeStringColumns.requiredDateTimeColumnString,
            };

            for (const [ name, column ] of Object.entries(columnMapping)) {
                const query = db.selectFrom(tableWithDateTimeStringColumns)
                    .selectOneColumn(column)
                    .query();

                expect(query).toEqual(
                    `select date_format(${name}, "%Y-%m-%dT%TZ[UTC]") as result from tbl`);
            }
        }

        // -----------------------------------------------------------------------------------------
        // TIME:
        // -----------------------------------------------------------------------------------------
        {
            const columnMapping = {
                'time_default_optional':
                    tableWithDateTimeStringColumns.optionalDefaultTimeColumnString,
                'time_optional': tableWithDateTimeStringColumns.optionalTimeColumnString,
                'time_default_required':
                    tableWithDateTimeStringColumns.requiredDefaultTimeColumnString,
                'time_required': tableWithDateTimeStringColumns.requiredTimeColumnString,
            };

            for (const [ name, column ] of Object.entries(columnMapping)) {
                const query = db.selectFrom(tableWithDateTimeStringColumns)
                    .selectOneColumn(column)
                    .query();

                expect(query).toEqual(`select date_format(${name}, "%T") as result from tbl`);
            }
        }

        // -----------------------------------------------------------------------------------------
        // TIMESTAMP:
        // -----------------------------------------------------------------------------------------
        {
            const columnMapping = {
                'timestamp_default_optional':
                    tableWithDateTimeStringColumns.optionalDefaultTimestampColumnString,
                'timestamp_optional': tableWithDateTimeStringColumns.optionalTimestampColumnString,
                'timestamp_default_required':
                    tableWithDateTimeStringColumns.requiredDefaultTimestampColumnString,
                'timestamp_required': tableWithDateTimeStringColumns.requiredTimestampColumnString,
            };

            for (const [ name, column ] of Object.entries(columnMapping)) {
                const query = db.selectFrom(tableWithDateTimeStringColumns)
                    .selectOneColumn(column)
                    .query();

                expect(query).toEqual(
                    `select date_format(${name}, "%Y-%m-%dT%TZ[UTC]") as result from tbl`);
            }
        }
    });
});
