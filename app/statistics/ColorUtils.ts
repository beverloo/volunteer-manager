// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import * as d3 from 'd3-scale-chromatic';

/**
 * Intention of the data point that should be communicated by this colour.
 */
type ColorIntention = 'disabled' | 'error' | 'info' | 'success' | 'warning';

/**
 * Computes a purposeful colour. When `index` and `total` are omitted a bright default colour will
 * be used. When `index` and `total` are provided, a gradient will be calculated instead.
 *
 * @example computeColor('success') -> #[todo]
 * @example computeColor('success', 0, 2) -> #[todo]
 * @example computeColor('success', 1, 2) -> #[todo]
 */
export function computeColor(intention: ColorIntention): string;
export function computeColor(intention: ColorIntention, index: number, total: number): string;
export function computeColor(intention: ColorIntention, index?: number, total?: number): string {
    const kRangeMinimum = 0.25;
    const kRangeMaximum = 0.80;

    let rangePosition = kRangeMaximum;
    if (typeof index === 'number' && typeof total === 'number')
        rangePosition = kRangeMinimum + ((index / (total - 1)) * (kRangeMaximum - kRangeMinimum));

    switch (intention) {
        case 'disabled':
            return d3.interpolateGreys(0.35);
        case 'error':
            return d3.interpolateReds(rangePosition);
        case 'info':
            return d3.interpolateBlues(rangePosition);
        case 'warning':
            return d3.interpolateOranges(rangePosition - /* for contrast= */ 0.15);
        case 'success':
            return d3.interpolateGreens(rangePosition);
    }

    throw new Error(`Unrecognised intention was passed: ${intention}`);
}

/**
 * Returns a color from a predefined, indexed palette. The palette will be recycled when we run
 * out of colours. The Tableau 10 colour scheme is used:
 *
 * @see https://www.tableau.com/blog/colors-upgrade-tableau-10-56782
 */
export function getIndexedColor(index: number): string {
    return d3.schemeTableau10[index % d3.schemeTableau10.length];
}
