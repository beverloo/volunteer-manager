// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { type Metadata } from 'next';

import { ClientProviders } from './ClientProviders';
import { kDefaultPageTitle, kDefaultPageDescription } from './config';

/**
 * Default metadata for the application. Any server-side page can override these values, and they
 * will be swapped out in the <head> section of the <RootLayout /> component.
 */
export const metadata: Metadata = {
  colorScheme: 'only light',
  description: kDefaultPageDescription,
  robots: 'noindex, nofollow',
  title: kDefaultPageTitle,
};

/**
 * Props accepted by the <RootLayout> component. Will be called by NextJS.
 */
interface RootLayoutProps {
  children: React.ReactElement,
}

/**
 * The root layout of the Volunteer Manager application. Content will be rendered in here based on
 * the path that has been requested by the client, allowing for middleware routing.
 */
export default function RootLayout(props: RootLayoutProps) {
  return (
    <html lang="en">
      <head></head>
      <body>
        <ClientProviders>
          {props.children}
        </ClientProviders>
      </body>
    </html>
  );
}
