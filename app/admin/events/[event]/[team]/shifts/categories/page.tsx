// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { ShiftCategoriesTable } from './ShiftCategoriesTable';
import { generateEventMetadataFn } from '../../../generateEventMetadataFn';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The shift categories page allows administrators to modify the categories in which shifts can be
 * created. The category defines the shift's colour—chromatic colours can be calculated.
 */
export default async function ShiftCategoriesPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'event.shift-categories',
    });

    return (
        <Section title="Shift categories">
            <SectionIntroduction important>
                Shift categories are <strong>shared across all events and teams</strong>, and
                define the visual identity of each shift in scheduling.
            </SectionIntroduction>
            <ShiftCategoriesTable />
        </Section>
    );
}

export const generateMetadata = generateEventMetadataFn('Shift categories');
