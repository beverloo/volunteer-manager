// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useContext } from 'react';

import { KnowledgeBaseCard } from './components/KnowledgeBaseCard';
import { NardoAdviceCard } from './components/NardoAdviceCard';
import { OverviewVendorCard } from './components/OverviewVendorCard';
import { ScheduleContext } from './ScheduleContext';
import { VendorTeam } from '@lib/database/Types';
import { useIsMobile } from './lib/useIsMobile';

/**
 * Displays the portal's overview page, which contains a series of cards displaying key information
 * necessary for the volunteer to perform their duties. All information is sourced from the context.
 */
export function OverviewPage() {
    const schedule = useContext(ScheduleContext);

    const isMobile = useIsMobile();

    return (
        <>
            { /* TODO: Event status */ }
            { /* TODO: Current shift */ }
            { /* TODO: Upcoming shift */ }
            { /* TODO: Available back-up volunteers */ }
            { /* TODO: Available senior volunteers */ }
            { (!!isMobile && !!schedule?.knowledge?.length) &&
                <KnowledgeBaseCard slug={schedule.slug} /> }
            { !!schedule?.vendors[VendorTeam.FirstAid] &&
                <OverviewVendorCard team={VendorTeam.FirstAid} /> }
            { !!schedule?.vendors[VendorTeam.Security] &&
                <OverviewVendorCard team={VendorTeam.Security} /> }
            { !!schedule?.nardo && <NardoAdviceCard advice={schedule.nardo} /> }
        </>
    );
}
