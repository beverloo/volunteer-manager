// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

const nextBuildId = require('next-build-id');
const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true });

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        // `process.env.GIT_COMMIT` will be set for Docker builds, where it's determined through the
        // next-build-id library locally on the machine for other kinds of builds. Do update
        // Docker.build.js when changing the logic in this file.
        buildHash: process.env.BUILD_HASH || nextBuildId.sync({ dir: __dirname }).substring(0, 7),
    },
    experimental: {
        // https://nextjs.org/blog/next-15-1#forbidden-and-unauthorized-experimental
        authInterrupts: true,
    },
    output: 'standalone',
    reactStrictMode: true,
    redirects: async() => ([
        {
            source: '/hallo',
            destination: '/registration',
            permanent: true,
        },
        {
            source: '/hello',
            destination: '/registration',
            permanent: true,
        },
    ]),
    typescript: {
        tsconfigPath: './tsconfig.build.json',
    },
};

module.exports = process.env.ANALYZE === 'true'
    ? withBundleAnalyzer(nextConfig)
    : nextConfig;
