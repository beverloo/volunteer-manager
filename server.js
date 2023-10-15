// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

const path = require('path');

require('next');
const { startServer } = require('next/dist/server/lib/start-server');

// Change the directory to the one this script is located in, regardless of current directory.
process.chdir(__dirname);

// Make sure commands gracefully respect termination signals (e.g. from Docker)
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

// -------------------------------------------------------------------------------------------------
//
// Notes:
//   - If ever needed, the configuration that Next.js' own script injects can be found in the output
//     directory, and thus loaded from there:
//     https://github.com/vercel/next.js/discussions/40355#discussioncomment-3631640
//
// -------------------------------------------------------------------------------------------------

// Invokes the Next.js `startServer()` function with the documented parameters. It's worth noting
// that the generated `server.js` file also passes configuration, which is not consumed by Next.js.
//
// @see https://github.com/vercel/next.js/blob/canary/packages/next/src/server/lib/start-server.ts
startServer({
    dir: path.join(__dirname),
    port: parseInt(process.env.PORT, 10) || 3000,
    isDev: true,//process.env.NODE_ENV === 'development',
    hostname: process.env.HOSTNAME ?? '0.0.0.0',
    allowRetry: false,
    minimalMode: undefined,
    keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10) ?? undefined,

    // logging info
    envInfo: undefined,
    expFeatureInfo: undefined,

    // this is dev-server only
    isExperimentalTestProxy: undefined,
    selfSignedCertificate: undefined,

}).catch((err) => {
    console.error(err);
    process.exit(1);
});
