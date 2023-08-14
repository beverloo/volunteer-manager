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
        const { stdout, stderr } = { stdout: '', stderr: '' };
        //const { stdout, stderr }
        //    = await exec(`tbls out ${connection} -t yaml -o ${kOutputScheme}`);

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

        // TODO: Figure out how to create proper mappings here.
        fieldMappings: [
            {
                columnType: /(medium)?blob/,
                generatedField: false,
            },
            {
                columnType: /enum/,
                generatedField: false,
            },
            {
                columnType: /set/,
                generatedField: false,
            }
        ],

        rawContent: {
            before: '/* eslint-disable quotes */',
        }
    });

    await generator.generate();

} while (false);
