// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';

import { type Environment, kEnvironmentColours } from '@app/Environment';

/**
 * Props accepted by the <TeamChip> component.
 */
export interface TeamChipProps {
    /**
     * The team for which a chip is being rendered.
     */
    team: string;
}

/**
 * The <TeamChip> component draws a <Chip> coloured following the identity of the team given in the
 * props. By default a more neutral colour will be used for non-existing teams.
 */
export function TeamChip(props: TeamChipProps) {
    const kTeamEnvironmentMap: { [k: string]: Environment } = {
        Crew: 'gophers.team',
        Hosts: 'hosts.team',
        Stewards: 'stewards.team',
    };

    const { team } = props;
    const theme = useTheme();

    const environment = kTeamEnvironmentMap[team] || 'animecon.team';
    const colour = kEnvironmentColours[environment][theme.palette.mode];

    return (
        <Chip size="small"
            color="primary" variant="outlined" label={team}
            sx={{
                borderWidth: 0, backgroundColor: colour, color: 'white'
            }} />
    );
}
