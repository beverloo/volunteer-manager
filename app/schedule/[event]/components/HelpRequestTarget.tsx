// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Box from '@mui/material/Box';
import MoodOutlinedIcon from '@mui/icons-material/MoodOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';

import { DisplayHelpRequestTarget } from '@lib/database/Types';

import { kHelpRequestColours } from '@app/admin/system/displays/HelpRequestColours';

/**
 * Icon to use for each of the request targets. Will be drawn in white.
 */
const kTargetIcon: { [k in DisplayHelpRequestTarget]: React.ReactNode } = {
    [DisplayHelpRequestTarget.Crew]: <PeopleAltOutlinedIcon fontSize="inherit" />,
    [DisplayHelpRequestTarget.Nardo]: <MoodOutlinedIcon fontSize="inherit" />,
    [DisplayHelpRequestTarget.Stewards]: <SecurityOutlinedIcon fontSize="inherit" />,
};

/**
 * Props accepted by the <HelpRequestTarget> component.
 */
interface HelpRequestTargetProps {
    /**
     * Target of the help request, in other words, who is expected to help out?
     */
    target: DisplayHelpRequestTarget;
}

/**
 * The <HelpRequestTarget> component displays a coloured box with an icon to visually indicate who
 * the target audience for this help request is. This helps volunteers skim for relevant requests.
 */
export function HelpRequestTarget(props: HelpRequestTargetProps) {
    const [ foreground, background ] = kHelpRequestColours[props.target];
    return (
        <Box sx={{
            backgroundColor: background,
            color: foreground,

            borderRadius: '4px',
            width: '24px',
            height: '24px',
            fontSize: '16px',

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            { kTargetIcon[props.target] }
        </Box>
    );
}
