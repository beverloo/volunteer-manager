// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata, Viewport } from 'next';

import { ClientProviders } from './ClientProviders';
import { determineEnvironment } from '@lib/Environment';

/**
 * Default metadata for the application. Any server-side page can override these values, and they
 * will be swapped out in the <head> section of the <RootLayout /> component.
 */
export const metadata: Metadata = {
    description: 'Volunteer portal for the AnimeCon conventions',
    robots: 'noindex, nofollow',
    title: 'AnimeCon Volunteering Teams',
};

/**
 * Default viewport configuration for the application.
 */
export const viewport: Viewport = {
    // TODO: Dynamically generate the theme colour based on the environment
    colorScheme: 'only light',
};

/**
 * The root layout of the Volunteer Manager application. Content will be rendered in here based on
 * the path that has been requested by the client, allowing for middleware routing.
 */
export default async function RootLayout(props: React.PropsWithChildren) {
    const environment = await determineEnvironment();

    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
            </head>
            <body>
                <ClientProviders paletteMode="auto" themeColours={environment?.themeColours}>
                    {props.children}
                </ClientProviders>
            </body>
        </html>
    );
}
