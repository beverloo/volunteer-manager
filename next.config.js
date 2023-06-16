// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

const nextBuildId = require('next-build-id');

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        buildHash: nextBuildId.sync({ dir: __dirname }).substring(0, 7),
    },
    output: 'standalone',
    reactStrictMode: true,
};

module.exports = nextConfig;
