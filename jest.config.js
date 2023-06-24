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
    testEnvironment: 'jest-environment-jsdom',
});

/**
 * Set global variables that should be available during the testing cycle. Note that none of these
 * should match either the development or production settings exported elsewhere.
 */
process.env = Object.assign(process.env, {
    APP_PASSRESET_PASSWORD: 'kf205;e8.F*=AS9ItS(aQ$s;z&PM>6u?',
});
