// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { default as MuiChip, type ChipProps as MuiChipProps } from '@mui/material/Chip';

/**
 * Props accepted by the <Chip> component.
 */
interface ChipProps extends Omit<MuiChipProps, 'color'> {
    /**
     * CSS color in which the chip should be rendered.
     */
    color: string;

    /**
     * CSS color in which the chip's label should be rendered. Defaults to #FFFFFF.
     */
    textColor?: string;
}

/**
 * The <Chip> component is a regular MUI <Chip>, except that it allows the `color` property to be
 * set to any valid HTML colour as opposed to just the default theme colors.
 */
export function Chip(props: ChipProps) {
    const { color, textColor, ...chipProps } = props;

    return (
        <MuiChip size="small" color="primary" variant="outlined" {...chipProps}
                 sx={{
                     borderWidth: 0,
                     backgroundColor: props.color,
                     color: props.textColor ?? '#ffffff',
                 }} />
    );
}
