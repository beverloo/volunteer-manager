// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

const nextJest = require('next/jest');
const createJestConfig = nextJest({
    dir: './',
});

/**
 * Jest configuration applying to the Volunteer Manager.
 */
module.exports = createJestConfig({
    moduleNameMapper: {
        '^d3-(.*)$': '<rootDir>/node_modules/d3-$1/dist/d3-$1.min.js',
    },
    testEnvironment: 'jest-environment-jsdom',
    testPathIgnorePatterns: [ 'e2e' ],
    setupFiles: [ 'whatwg-fetch' ],
    setupFilesAfterEnv: [ 'jest-extended/all' ],
});

/**
 * Set global variables that should be available during the testing cycle. Note that none of these
 * should match either the development or production settings exported elsewhere.
 */
process.env = Object.assign(process.env, {
    APP_COOKIE_PASSWORD: '3P72PZv>)v42[GUS%(st[%<(o.^f58Vy',
    APP_PASSRESET_PASSWORD: 'kf205;e8.F*=AS9ItS(aQ$s;z&PM>6u?',
    APP_REGISTRATION_PASSWORD: 'fK&K4dK6zd7<&AXz$yi>}5Z=uoqbkfFR',
    APP_SMTP_HOST: 'mail.example.com',
    APP_SMTP_PORT: '587',
    APP_SMTP_USERNAME: 'user@example.com',
    APP_SMTP_PASSWORD: 'password',
});
