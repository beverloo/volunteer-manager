// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

const childProcess = require('child_process');
const nextBuildId = require('next-build-id');

/**
 * Retrieve the build hash, which we base on the latest Git commit hash. This should stay in sync
 * with the build hash logic included in next.config.js.
 */
const buildHash = nextBuildId.sync({ dir: __dirname }).substring(0, 7);

/**
 * Execute the regular "docker build" command and inject the build hash. The argument will be picked
 * up by the Dockerfile and then be made available to next.config.js as an environment variable.
 */
childProcess.execSync([
    'docker build',
    '--cpuset-cpus 0-2', '-m 2g',
    `--build-arg BUILD_HASH=${buildHash}`,
    '--ssh default=~/.ssh/id_ed25519',
    '-t volunteer-manager-docker',
    '.',
].join(' '), {
    env: {
        DOCKER_BUILDKIT: '1',
    },
    stdio: 'inherit'
});
