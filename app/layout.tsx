// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

export const metadata = {
  title: 'Volunteer Manager',
  description: 'Volunteer Manager initial main page',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Next.js</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
