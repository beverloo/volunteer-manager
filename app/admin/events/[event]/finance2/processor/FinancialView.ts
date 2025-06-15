// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { FinancialData } from './FinancialData';

import { kEventSalesCategory, type EventSalesCategory } from '@lib/database/Types';

/**
 * Utility function to determine whether |category| describes ticket sales.
 */
function isTicketSalesCategory(category: EventSalesCategory): boolean {
    return category === kEventSalesCategory.TicketFriday ||
           category === kEventSalesCategory.TicketSaturday ||
           category === kEventSalesCategory.TicketSunday ||
           category === kEventSalesCategory.TicketWeekend;
}

/**
 * Generates the view necessary to populate the `<EventRevenueCard>` component.
 */
export function generateEventTicketRevenueView(financialData: FinancialData) {
    return financialData.data.map(event => {
        let figure = 0;

        // TODO: Calculate the changePercentage

        for (const product of event.products.values()) {
            if (product.category !== kEventSalesCategory.Event)
                continue;  // only consider events

            if (!product.price)
                continue;  // unable to factor priceless products into revenue

            for (const [ days, sale ] of product.sales.entries()) {
                if (days < financialData.remaining)
                    continue;

                figure += sale * product.price;
            }
        }

        return {
            label: event.shortName,
            figure,
        };
    });
}

/**
 * Generates the view necessary to populate the `<EventSalesCard>` component.
 */
export function generateEventTicketSalesView(financialData: FinancialData) {
    return financialData.data.map(event => {
        let figure = 0;

        // TODO: Calculate the changePercentage

        for (const product of event.products.values()) {
            if (product.category !== kEventSalesCategory.Event)
                continue;  // only consider events

            for (const [ days, sale ] of product.sales.entries()) {
                if (days < financialData.remaining)
                    continue;

                figure += sale;
            }
        }

        return {
            label: event.shortName,
            figure,
        };
    });
}

/**
 * Generates the view necessary to populate the `<TicketRevenueCard>` component.
 */
export function generateTicketRevenueView(financialData: FinancialData) {
    return financialData.data.map(event => {
        let figure = 0;

        // TODO: Calculate the changePercentage

        for (const product of event.products.values()) {
            if (!isTicketSalesCategory(product.category))
                continue;  // only consider ticket sales

            if (!product.price)
                continue;  // unable to factor priceless products into revenue

            for (const [ days, sale ] of product.sales.entries()) {
                if (days < financialData.remaining)
                    continue;

                figure += sale * product.price;
            }
        }

        return {
            label: event.shortName,
            figure,
        };
    });
}

/**
 * Generates the view necessary to populate the `<TicketSalesCard>` component.
 */
export function generateTicketSalesView(financialData: FinancialData) {
    return financialData.data.map(event => {
        let figure = 0;

        // TODO: Calculate the changePercentage

        for (const product of event.products.values()) {
            if (!isTicketSalesCategory(product.category))
                continue;  // only consider ticket sales

            for (const [ days, sale ] of product.sales.entries()) {
                if (days < financialData.remaining)
                    continue;

                figure += sale;
            }
        }

        return {
            label: event.shortName,
            figure,
        };
    });
}
