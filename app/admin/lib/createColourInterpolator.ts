// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { color, type ColorCommonInstance } from 'd3-color';
import { interpolateRgbBasis } from 'd3-interpolate';

/**
 * Type definition for a function that, given `t` (0-1), calculates the given colour on the scale.
 */
export type ColourInterpolator = (t: number) => string;

/**
 * Creates a new colour interpolator for the given `range` colours, which must be one or more
 * colours separated by a comma. The interpolator will be created using d3.
 */
export function createColourInterpolator(range: string): ColourInterpolator {
    const colours: ColorCommonInstance[] = [];
    for (const colour of range.split(',')) {
        const colourInstance = color(colour);
        if (!!colourInstance)
            colours.push(colourInstance);
    }

    switch (colours.length) {
        case 0:
            return interpolateRgbBasis([ '#f5f5f5', '#424242' ]);  // grey
        case 1:
            return () => colours[0].toString();
        default:
            return interpolateRgbBasis(colours);
    }
}
