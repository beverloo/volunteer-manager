// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link'

import type { SxProps, Theme } from '@mui/system';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { type EventData } from '../lib/Event';
import { type UserData } from '../lib/auth/UserData';
import { Privilege, can } from '../lib/auth/Privileges';

/**
 * Manual styles that apply to the <WelcomePage> client component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    header: {
        backgroundColor: 'primary.dark',
        color: theme => theme.palette.getContrastText(theme.palette.primary.dark),
        display: 'flex',

        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,

        margin: 0,
        paddingX: 2,
        paddingY: 1,
    },
    text: {
        flex: 1,
        paddingRight: 2,
    },
};

/**
 * Properties accepted by the <WelcomePage> client component.
 */
export interface WelcomePageProps {
    /**
     * The events (zero or more) the current visitor has access to.
     */
    events: EventData[];

    /**
     * The User the current visitor is signed in as, if any.
     */
    user?: UserData;

    /**
     * Title of the page that should be displayed at the top. Dependent on the environment.
     */
    title: string;

    /**
     * Description of the functions of the team that this page represents.
     */
    description: string;
}

/**
 * The welcome page is the domain's root page, which routes the user to applicable applications. For
 * most visitors (who are not signed in) this includes registration for the latest event and the
 * ability to sign-in to access the portal, whereas more senior volunteers should also see buttons
 * towards the Admin and Statistics apps.
 */
export function WelcomePage(props: WelcomePageProps) {
    const events = props.events ?? [];

    return (
        <>
            <Paper elevation={2}>
                { /* Section: Page header */ }
                <Stack direction="row" justifyContent="space-between" sx={kStyles.header}>
                    <Typography sx={kStyles.text} variant="h5" component="h1" noWrap>
                        AnimeCon {props.title}
                    </Typography>
                    { /* TODO: Sign-in button */ }
                </Stack>

                { /* Section: Participation status */ }
                { /* TODO */ }

                { /* Section: Landing page */ }
                <Grid container spacing={2}>
                    <Grid item xs={5} sx={{ m: 2 }}>
                        <Typography variant="body1">
                            { /* TODO: Support Markdown */ }
                            {props.description}
                        </Typography>
                        <Stack direction="column" spacing={2} sx={{ mt: 2 }}>
                            <Button variant="contained">Want to join the {props.title}?</Button>
                            <Button variant="outlined">Access the volunteer portal</Button>
                        </Stack>
                    </Grid>
                    <Grid item xs={7}>
                        { /* TODO: Photo */ }
                    </Grid>
                </Grid>
            </Paper>

            { /* Section: Further content */ }
            <Grid container spacing={2} sx={{ mt: 0 }}>
                { can(props.user, Privilege.Administrator) &&
                    <Grid item xs={12} md={4}>
                        <Card elevation={2}>
                            <CardContent sx={{ pb: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="h5" component="p">
                                        Administration
                                    </Typography>
                                    <Tooltip title="Access is limited to Senior+ volunteers">
                                        <VisibilityOffIcon fontSize="small" color="disabled" />
                                    </Tooltip>
                                </Stack>
                                <Typography variant="body2">
                                    Access to the administration area where we manage the events,
                                    volunteers and scheduling.
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Link href="/admin" passHref>
                                    <Button size="small" startIcon={ <ExitToAppIcon />}>
                                        Launch
                                    </Button>
                                </Link>
                            </CardActions>
                        </Card>
                    </Grid> }

                { can(props.user, Privilege.Statistics) &&
                    <Grid item xs={12} md={4}>
                        <Card elevation={2}>
                            <CardContent sx={{ pb: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="h5" component="p">
                                        Statistics
                                    </Typography>
                                    <Tooltip title="Access is limited to selected volunteers">
                                        <VisibilityOffIcon fontSize="small" color="disabled" />
                                    </Tooltip>
                                </Stack>
                                <Typography variant="body2">
                                    Multi-year statistics about the demographics, scope and
                                    performance of the {props.title}.
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Link href="/statistics" passHref>
                                    <Button size="small" startIcon={ <ExitToAppIcon />}>
                                        Launch
                                    </Button>
                                </Link>
                            </CardActions>
                        </Card>
                    </Grid> }
            </Grid>
        </>
    );
}
