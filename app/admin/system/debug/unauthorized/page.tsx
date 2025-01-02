// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { unauthorized } from 'next/navigation';

/**
 * Page that triggers the Next.js unauthorized() page.
 */
export default function UnauthorizedPage() {
    return unauthorized();
}
