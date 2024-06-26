// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { PaletteMode } from '@mui/material';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';

/**
 * Props accepted by the <TeamChip> component.
 */
interface TeamChipProps {
    /**
     * Colours in which the team chip should be rendered.
     */
    colours: { [key in PaletteMode]: string };

    /**
     * Label that should be shown on the team chip.
     */
    label: string;
}

/**
 * The <TeamChip> component draws a <Chip> coloured following the identity of the team given in the
 * props. By default a more neutral colour will be used for non-existing teams.
 */
export function TeamChip(props: TeamChipProps) {
    const { colours, label } = props;

    const theme = useTheme();
    const colour = colours[theme.palette.mode];

    return (
        <Chip size="small"
              color="primary" variant="outlined" label={label}
              sx={{
                  borderWidth: 0,
                  backgroundColor: colour,
                  color: 'white'
              }} />
    );
}
