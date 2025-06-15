// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { FinanceProcessor } from '../FinanceProcessor';
import { KeyMetricCard } from './KeyMetricCard';

/**
 * Props accepted by the <EventRevenueCard> component.
 */
interface EventRevenueCardProps {
    /**
     * The financial processor that contains the relevant ticket sale information.
     */
    processor: FinanceProcessor;
}

/**
 * The <EventRevenueCard> component displays the event ticket revenue KPI card.
 */
export function EventRevenueCard(props: EventRevenueCardProps) {
    const view = props.processor.eventTicketRevenueView;

    const headline = view.shift()!;
    const historical = view;

    return (
        <KeyMetricCard title="Event ticket revenue" format="revenue" headline={headline}
                       historical={historical}>
            Graph
        </KeyMetricCard>
    );
}
