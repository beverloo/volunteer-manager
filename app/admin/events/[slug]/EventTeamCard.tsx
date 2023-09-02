// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box, { type BoxProps } from '@mui/material/Box';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Paper from '@mui/material/Paper';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

/**
 * Props accepted by the <TeamIdentityHeader> component.
 */
interface TeamIdentityHeaderProps extends BoxProps {
    /**
     * Dark-theme variant of the team's identity.
     */
    darkThemeColour: string;

    /**
     * Light-theme variant of the team's identity.
     */
    lightThemeColour: string;
};

/**
 * The <TeamIdentityHeader> component displays a box appropriately coloured in the team's identity,
 * with a font colour that provides an appropriate amount of context.
 */
const TeamIdentityHeader = styled((props: TeamIdentityHeaderProps) => {
    const { darkThemeColour, lightThemeColour, ...rest } = props;
    return <Box {...rest} />;
})(({ darkThemeColour, lightThemeColour, theme }) => {
    const backgroundColor = theme.palette.mode === 'light' ? lightThemeColour : darkThemeColour;
    const color = theme.palette.getContrastText(backgroundColor);

    return {
        backgroundColor, color,
        borderRadius: theme.shape.borderRadius,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    };
});

/**
 * The <TeamIdentityFooter> component displays a box similarly themed after the team's identity, but
 * for usage at the bottom of another component.
 */
const TeamIdentityFooter = styled(TeamIdentityHeader)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginBottom: '-1px !important',
    height: '1rem',
}));

/**
 * Props accepted by the <EventTeamCard> component.
 */
export interface EventTeamCardProps {
    /**
     * Name of the team for which this card is being displayed.
     */
    teamName: string;

    /**
     * The dark theme & light theme variants of the team's theme colour. Will be used to personalise
     * the card specific to this team.
     */
    teamColourDarkTheme: string;
    teamColourLightTheme: string;

    /**
     * Number of volunteers in the team, and the target number of volunteers they're striving for.
     */
    teamTargetSize: number;
    teamSize: number;

    /**
     * Settings regarding availability of actions based on the team's configuration.
     */
    enableContent: boolean;
    enableRegistration: boolean;
    enableSchedule: boolean;
}

/**
 * The <EventTeamCard> component displays information associated with a particular team, giving a
 * birdseye view on how the team is doing, and what the team settings for this events are.
 */
export function EventTeamCard(props: EventTeamCardProps) {
    const { teamColourDarkTheme, teamColourLightTheme } = props;

    return (
        <Paper sx={{ aspectRatio: 1.25 }}>
            <Stack direction="column" spacing={2} justifyContent="space-between"
                   sx={{ height: '100%' }}>
                <TeamIdentityHeader darkThemeColour={teamColourDarkTheme}
                                    lightThemeColour={teamColourLightTheme} sx={{ px: 2, py: 1 }}>
                    <Typography variant="h5">
                        {props.teamName}
                    </Typography>
                </TeamIdentityHeader>
                <Stack direction="column" spacing={2} alignItems="center">
                    <Stack direction="column">
                        <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="# of volunteers">
                                <Typography variant="h5">
                                    {props.teamSize}
                                </Typography>
                            </Tooltip>
                            { !!props.teamTargetSize &&
                                <>
                                    <Typography variant="h5" sx={{ color: 'text.disabled' }}>
                                        /
                                    </Typography>
                                    <Tooltip title="target # of volunteers"
                                             sx={{ color: 'text.disabled' }}>
                                        <Typography variant="h5">
                                            {props.teamTargetSize}
                                        </Typography>
                                    </Tooltip>
                                </> }
                        </Stack>
                        <Typography variant="button" align="center">
                            Volunteers
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} justifyContent="center">
                        { props.enableContent &&
                            <Tooltip title="Information has been published">
                                <InfoOutlinedIcon color="success" />
                            </Tooltip> }
                        { !props.enableContent &&
                            <Tooltip title="Information has not been published">
                                <InfoOutlinedIcon color="error" />
                            </Tooltip> }

                        { props.enableRegistration &&
                            <Tooltip title="Applications are being accepted">
                                <PlayCircleOutlineIcon color="success" />
                            </Tooltip> }
                        { !props.enableRegistration &&
                            <Tooltip title="Applications have been suspended">
                                <PauseCircleOutlineIcon color="error" />
                            </Tooltip> }

                        { props.enableSchedule &&
                            <Tooltip title="Schedules have been published">
                                <EventAvailableIcon color="success" />
                            </Tooltip> }
                        { !props.enableSchedule &&
                            <Tooltip title="Schedules have not been published">
                                <EventBusyIcon color="error" />
                            </Tooltip> }
                    </Stack>
                </Stack>
                <TeamIdentityFooter darkThemeColour={teamColourDarkTheme}
                                    lightThemeColour={teamColourLightTheme} />
            </Stack>
        </Paper>
    );
}
