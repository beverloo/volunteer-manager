// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

/**
 * Page that triggers the Next.js notFound() page.
 */
export default function NotFoundPage() {
    return notFound();
}
