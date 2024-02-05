// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Generator } from 'ts-sql-codegen';
import { readFile } from 'node:fs/promises';
import util from 'util';

const exec = util.promisify((await import('child_process')).exec);

/**
 * Input file in which the database connection source is exported.
 */
const kInputConnectionSource = './app/lib/database/Connection';

/**
 * Directory in which the generated database schemes for use with `ts-sql-query` should be stored.
 */
const kOutputDirectory = './app/lib/database/scheme/';

/**
 * Filename in which the YAML-based database scheme should be stored.
 */
const kOutputScheme = './ts-sql.scheme.yaml';

do {
    // (1) Determine the version of the `tbls` tool that's installed, and prompt when it's either
    //     missing or too old for our liking.
    try {
        const { stdout } = await exec('tbls version');
        const [ major, minor ] = stdout.trim().split('.').map(v => parseInt(v));

        if (major !== 1 || minor < 68) {
            console.log('The `tbls` tool used in this repository is only supported for version');
            console.log('1.68 and beyond, but stuck to major version 1. Please update this script');
            console.log('to verify everything is still working if necessary.');
            break;
        }
    } catch (error) {
        console.log('The `tbls` tool does not seem to be installed, or could not be invoked. You');
        console.log('should install it from the following page, and make sure that the command is');
        console.log('available on the global path.');
        console.log('');
        console.log('https://github.com/k1LoW/tbls#install');
        break;
    }

    // (2) Load the database connection information from `.env.production` in the current directory.
    //     This limits use of the command to people with access to the production details indeed.
    const environment = new Map();
    try {
        const environmentFile = await readFile('./.env.production', { encoding: 'utf8' });
        const environmentLines = environmentFile.trimEnd().split(/\r?\n/g);

        for (const line of environmentLines) {
            const [ key, value ] = line.split('=', /* limit= */ 2);
            const normalizedValue = value.replace(/^"|"$/g, '');

            environment.set(key, normalizedValue);
        }
    } catch(error) {
        console.log('Unable to read environment information from the ".env.production" file in');
        console.log('the project root directory:');
        console.error(error);
        break;
    }

    const connection = [
        'mysql://', environment.get('APP_DATABASE_USERNAME'),
        ':', environment.get('APP_DATABASE_PASSWORD'),
        '@', environment.get('APP_DATABASE_SERVER'),
        ':', environment.get('APP_DATABASE_PORT'),
        '/', environment.get('APP_DATABASE_NAME')
    ].join('');

    // (3) Run the `tbls` command to output the format in YAML format. This will write the latest
    //     scheme to a file called "ts-sql.scheme.yaml" where it can live until step (4).
    try {
        const { stdout, stderr }
            = await exec(`tbls out ${connection} -t yaml -o ${kOutputScheme}`);

        if (stdout.length || stderr.length) {
            console.log('Unexpected output from the `tbls` command:');
            console.log('  stdout =', stdout);
            console.log('  stderr =', stderr);
            break;
        }
    } catch (error) {
        console.error(error);
        break;
    }

    // (4) Run the `ts-sql-codegen` Generator to actually generate the database scheme, and store it
    //     in the
    const generator = new Generator({
        connectionSourcePath: kInputConnectionSource,
        outputDirPath: kOutputDirectory,
        schemaPath: kOutputScheme,

        common: {
            primaryKey: { isAutoGenerated: true },
        },

        fieldMappings: [
            // -------------------------------------------------------------------------------------

            // Blob types will be represented as a Buffer, which is the type that the underlying
            // MariaDB library uses on the transport layer anyway. Type adapters are defined in the
            // DBConnection implementation in /app/lib/database/Connection.ts.
            {
                columnType: /^(tiny|medium|long)?blob$/,
                generatedField: {
                    type: {
                        kind: 'custom',
                        dbType: { name: 'Blob' },
                        tsType: { name: 'Buffer' },
                        adapter: {
                            importPath: './app/lib/database/BlobTypeAdapter',
                            name: 'BlobTypeAdapter',
                        },
                    },
                },
            },

            // -------------------------------------------------------------------------------------

            // DATE columns will be represented as Temporal.PlainDate instances. Dates are not
            // associated with a timezone, but can be upgraded to ZonedDateTime if need be.
            {
                columnType: /^date$/i,
                generatedField: {
                    type: {
                        kind: 'customComparable',
                        dbType: { name: 'date' },
                        tsType: {
                            importPath: './app/lib/Temporal',
                            name: 'PlainDate',
                        },
                        adapter: {
                            importPath: './app/lib/database/TemporalTypeAdapter',
                            name: 'TemporalTypeAdapter',
                        },
                    },
                }
            },

            // TODO: DATETIME & TIMESTAMP

            // TIME columns will be represented as Temporal.PlainTime instances. Times are not
            // associated with a timezone, but can be upgraded to ZonedDateTime if need be.
            {
                columnType: /^time$/i,
                generatedField: {
                    type: {
                        kind: 'customComparable',
                        dbType: { name: 'time' },
                        tsType: {
                            importPath: './app/lib/Temporal',
                            name: 'PlainTime',
                        },
                        adapter: {
                            importPath: './app/lib/database/TemporalTypeAdapter',
                            name: 'TemporalTypeAdapter',
                        },
                    },
                }
            },

            // -------------------------------------------------------------------------------------

            // We represent dates and times as ZonedDateTime Temporal objects rather than the
            // default `Date` used by `ts-query-sql`. This supersedes our migration to DayJS, as
            // Temporal has a feature in being a standardised JavaScript feature provided natively.
            ...[
                { table: 'activities_areas', column: 'area_created' },
                { table: 'activities_areas', column: 'area_updated' },
                { table: 'activities_areas', column: 'area_deleted' },
                { table: 'activities_locations', column: 'location_created' },
                { table: 'activities_locations', column: 'location_updated' },
                { table: 'activities_locations', column: 'location_deleted' },
                { table: 'activities_logs', column: 'mutation_date' },
                { table: 'activities', column: 'activity_created' },
                { table: 'activities', column: 'activity_updated' },
                { table: 'activities', column: 'activity_deleted' },
                { table: 'activities_timeslots', column: 'timeslot_start_time' },
                { table: 'activities_timeslots', column: 'timeslot_end_time' },
                { table: 'activities_timeslots', column: 'timeslot_created' },
                { table: 'activities_timeslots', column: 'timeslot_updated' },
                { table: 'activities_timeslots', column: 'timeslot_deleted' },
                // { table: 'content', column: 'revision_date' },
                // { table: 'events', column: 'event_start_time' },
                // { table: 'events', column: 'event_end_time' },
                // { table: 'events', column: 'event_refunds_start_time' },
                // { table: 'events', column: 'event_refunds_end_time' },
                { table: 'exports_logs', column: 'access_date' },
                { table: 'exports', column: 'export_created_date' },
                { table: 'exports', column: 'export_expiration_date' },
                // { table: 'hotels_assignments', column: 'assignment_created' },
                // { table: 'hotels_preferences', column: 'hotel_preferences_updated' },
                // { table: 'logs', column: 'log_date' },
                // { table: 'nardo', column: 'nardo_author_date' },
                // { table: 'outbox', column: 'outbox_timestamp' },
                // { table: 'refunds', column: 'refund_requested' },
                // { table: 'refunds', column: 'refund_confirmed' },
                // { table: 'schedule', column: 'schedule_time_start' },
                // { table: 'schedule', column: 'schedule_time_end' },
                // { table: 'storage', column: 'file_date' },
                { table: 'tasks', column: 'task_scheduled_date' },
                { table: 'trainings_assignments', column: 'assignment_updated' },
                // { table: 'trainings_assignments', column: 'preference_updated' },
                // { table: 'trainings', column: 'training_start' },
                // { table: 'trainings', column: 'training_end' },
                // { table: 'users_events', column: 'registration_date' },
                // { table: 'users_events', column: 'preferences_updated' },
                // { table: 'users_passkeys', column: 'credential_created' },
                // { table: 'users_passkeys', column: 'credential_last_used' },
                { table: 'vendors', column: 'vendor_modified' },

            ].map(({ table, column }) => ([
                ...[ 'dateTime', 'timestamp' ].map(columnType => ({
                    // TODO: Apply this to all tables and columns, then delete the DayJS mapping.
                    tableName: table,
                    columnName: column,

                    columnType: new RegExp(`^${columnType}$`, 'i'),
                    generatedField: {
                        type: {
                            kind: 'customComparable',
                            dbType: { name: columnType },
                            tsType: {
                                importPath: './app/lib/Temporal',
                                name: 'ZonedDateTime',
                            },
                            adapter: {
                                importPath: './app/lib/database/TemporalTypeAdapter',
                                name: 'TemporalTypeAdapter',
                            },
                        },
                    }
                })),
            ])).flat(),

            // We represent dates and times as DayJS objects in UTC, rather than the default `Date`
            // used by `ts-query-sql`. In the future we'll want to update this to Temporal.
            ...[ 'dateTime', 'timestamp' ].map(columnType => ({
                columnType: new RegExp(`^${columnType}$`, 'i'),
                generatedField: {
                    type: {
                        kind: 'customComparable',
                        dbType: { name: columnType },
                        tsType: {
                            importPath: './app/lib/DateTime',
                            name: 'DateTime',
                        },
                        adapter: {
                            importPath: './app/lib/database/DateTimeTypeAdapter',
                            name: 'DateTimeTypeAdapter',
                        },
                    },
                },
            })),

            // -------------------------------------------------------------------------------------

            // Enumerations are all defined in `app/lib/database/types.ts`, and are manually added
            // to the field mappings to this effect. Each column needs to be specified separately.
            ...[
                { field: [ 'activities', 'activity_type' ], type: 'ActivityType' },
                { field: [ 'activities_areas', 'area_type' ], type: 'ActivityType' },
                { field: [ 'activities_locations', 'location_type' ], type: 'ActivityType' },
                { field: [ 'activities_logs', 'mutation' ], type: 'Mutation' },
                { field: [ 'activities_logs', 'mutation_severity' ], type: 'MutationSeverity' },
                { field: [ 'activities_timeslots', 'timeslot_type' ], type: 'ActivityType' },
                {
                    field: [ 'events', 'event_availability_status' ],
                    type: 'EventAvailabilityStatus'
                },
                { field: [ 'exports', 'export_type' ], type: 'ExportType' },
                { field: [ 'logs', 'log_severity' ], type: 'LogSeverity' },
                { field: [ 'retention', 'retention_status' ], type: 'RetentionStatus' },
                { field: [ 'roles', 'role_badge' ], type: 'RoleBadge' },
                { field: [ 'schedule', 'schedule_type' ], type: 'ScheduleType' },
                { field: [ 'storage', 'file_type' ], type: 'FileType' },
                { field: [ 'tasks', 'task_invocation_result' ], type: 'TaskResult' },
                { field: [ 'users_auth', 'auth_type' ], type: 'AuthType' },
                { field: [ 'users_events', 'registration_status' ], type: 'RegistrationStatus' },
                { field: [ 'users_events', 'shirt_fit' ], type: 'ShirtFit' },
                { field: [ 'users_events', 'shirt_size' ], type: 'ShirtSize' },
                { field: [ 'vendors', 'vendor_gender' ], type: 'VendorGender' },
                { field: [ 'vendors', 'vendor_shirt_fit' ], type: 'ShirtFit' },
                { field: [ 'vendors', 'vendor_shirt_size' ], type: 'ShirtSize' },
                { field: [ 'vendors', 'vendor_team' ], type: 'VendorTeam' },

            ].map(({ field, type }) => ({
                tableName: field[0],
                columnName: field[1],
                generatedField: {
                    type: {
                        kind: 'enum',
                        dbType: { name: type },
                        tsType: {
                            importPath: './app/lib/database/Types',
                            name: type,
                        },
                    },
                },
            })),

            // -------------------------------------------------------------------------------------
        ],

        rawContent: {
            before: '// @ts-nocheck\n/* eslint-disable quotes, max-len */',
        }
    });

    await generator.generate();

} while (false);
