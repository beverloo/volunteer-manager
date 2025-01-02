// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { forbidden } from 'next/navigation';

/**
 * Page that triggers the Next.js forbidden() page.
 */
export default function ForbiddenPage() {
    return forbidden();
}
