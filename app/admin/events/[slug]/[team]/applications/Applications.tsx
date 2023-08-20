// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import Typography from '@mui/material/Typography';

import type { PageInfoWithTeam } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { ApplicationResponseDialog } from './ApplicationResponseDialog';
import { Avatar } from '@app/components/Avatar';
import { PlaceholderPaper } from '@app/admin/components/PlaceholderPaper';

/**
 * Formatter for displaying the date on which the application was received.
 */
const kApplicationDateFormatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: undefined,
});

/**
 * The <NoApplications> component will be shown when there are no pending applications. This is a
 * good state because it means that nobody is waiting for an answer.
 */
function NoApplications() {
    return (
        <PlaceholderPaper sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} justifyContent="flex-start">
                <TaskAltIcon color="disabled" />
                <Typography sx={{ color: 'text.disabled' }}>
                    There are no pending applications
                </Typography>
            </Stack>
        </PlaceholderPaper>
    );
}

/**
 * Interface that describes the information that needs to be known for a pending application. Cards
 * will be shown displaying this in a structured manner.
 */
export interface ApplicationInfo {
    /**
     * Unique ID of the user about whom this application is being displayed.
     */
    userId: number;

    /**
     * Age of the volunteer at the time when the event is due to start.
     */
    age: number;

    /**
     * Whether the volunteer is fully available during the event.
     */
    fullyAvailable: boolean;

    /**
     * Date at which the registration was submitted.
     */
    date: Date;

    /**
     * First name of the volunteer who made this application.
     */
    firstName: string;

    /**
     * Last name of the volunteer who made this application.
     */
    lastName: string;

    /**
     * Hash of the avatar file that this volunteer has uploaded for themselves.
     */
    avatar?: string;

    /**
     * The preferences that the volunteer has indicated for their participation.
     */
    preferences?: string;

    /**
     * Their preferred upper bound on the maximum number of hours to help out with.
     */
    preferenceHours?: number;

    /**
     * Their preference on when their shifts should start during the day.
     */
    preferenceTimingStart?: number;

    /**
     * Their preference on when their shifts should end during the day.
     */
    preferenceTimingEnd?: number;

    /**
     * History of their participation in AnimeCon events. Only the number of events are conveyed,
     * for more information an administrator can look at their profile.
     */
    history: number;
}

/**
 * Props accepted by the <Application> component.
 */
interface ApplicationProps {
    /**
     * The application that's being displayed by this component.
     */
    application: ApplicationInfo;

    /**
     * Requests for the application to be approved or rejected.
     */
    requestResponse: (application: ApplicationInfo, action: 'approve' | 'reject') => void;
}

/**
 * The <Application> component displays an individual application that can be inspected, and then
 * either approved or rejected. Not all volunteers are allowed to manage applications.
 */
function Application(props: ApplicationProps) {
    const { application, requestResponse } = props;

    const avatarUrl = application.avatar ? `/avatars/${application.avatar}.png` : undefined;
    const avatar = (
        <Avatar src={avatarUrl}>
            {application.firstName} {application.lastName}
        </Avatar>
    );

    const information = [
        ...(
            application.history ?
            [
                {
                    icon: <InfoIcon fontSize="small" color="info" />,
                    message:
                        <>
                            {application.firstName} has volunteered
                            <strong>{ application.history === 1 ? ' once' :
                                ` ${application.history} times`}</strong> before.
                        </>
                }
            ] : [
                {
                    icon: <InfoIcon fontSize="small" color="info" />,
                    message: <>{application.firstName} has not helped out at AnimeCon before.</>,
                }
            ] ),
        {
            icon: <InfoIcon fontSize="small" color="info" />,
            message:
                <>
                    They're happy to volunteer for up to <strong>{application.preferenceHours} hours
                    </strong>, preferrably between the hours of
                    <strong> {`0${application.preferenceTimingStart}`.substr(-2)}:00
                    </strong> – <strong>
                        {`0${application.preferenceTimingEnd}`.substr(-2)}:00</strong>.
                </>
        },
        ...(
            application.preferences ?
            [
                {
                    icon: <InfoIcon fontSize="small" color="info" />,
                    message:
                        <>
                            They shared some preferences:
                            "<strong><em>{application.preferences}</em></strong>"
                        </>
                }
            ] : [ /* skip this row */ ] ),
        {
            icon: application.fullyAvailable ? <CheckCircleIcon fontSize="small" color="success" />
                                             : <HelpOutlineIcon fontSize="small" color="warning" />,
            message:
                <>
                    They indicated that they
                    <strong> {application.fullyAvailable ? 'will be' : 'will not be'} </strong>
                    fully available.
                </>
        },
        {
            icon: application.age >= 18 ? <CheckCircleIcon fontSize="small" color="success" />
                                        : <HelpOutlineIcon fontSize="small" color="warning" />,
            message:
                <>
                    {application.firstName} will be {application.age} years old during the event.
                </>
        },
    ];

    return (
        <Card>
            <CardHeader avatar={avatar}
                        titleTypographyProps={{ variant: 'subtitle1' }}
                        title={`${application.firstName} ${application.lastName}`}
                        subheader={kApplicationDateFormatter.format(application.date)} />
            <Divider />
            <CardContent sx={{ py: 0 }}>
                <List dense>
                    { information.map(({ icon, message }, index) =>
                        <ListItem key={index}>
                            <ListItemIcon>
                                {icon}
                            </ListItemIcon>
                            <ListItemText primary={message} />
                        </ListItem> )}
                </List>
            </CardContent>
            <Divider />
            <CardActions disableSpacing sx={{ justifyContent: 'flex-end', gap: 2 }}>
                <Button size="small" color="error" startIcon={ <ThumbDownIcon /> }
                        onClick={ () => requestResponse(application, 'reject') }>
                    Reject
                </Button>
                <Button size="small" color="success" startIcon={ <ThumbUpIcon /> }
                        onClick={ () => requestResponse(application, 'approve') }>
                    Approve
                </Button>
            </CardActions>
        </Card>
    );
}

/**
 * Props accepted by the <Applications> component.
 */
export interface ApplicationsProps {
    /**
     * The applications that are currently pending a response.
     */
    applications: ApplicationInfo[];

    /**
     * Information about the event for which applications are being shown.
     */
    event: PageInfoWithTeam['event'];

    /**
     * Information about the team for which applications are being shown.
     */
    team: PageInfoWithTeam['team'];
}

/**
 * The <Applications> component displays the pending applications which this volunteering team has
 * not yet responded to. Basic information is shown, and a decision can be made on this page by
 * event administrators and folks with the application management permissions.
 */
export function Applications(props: ApplicationsProps) {
    const { applications, event, team } = props;

    const [ action, setAction ] = useState<'approve' | 'reject'>();
    const [ open, setOpen ] = useState<boolean>(false);

    const [ application, setApplication ] = useState<{
        firstName: string,
        userId: number,
        eventId: number,
        teamId: number
    }>();

    const requestResponse = useCallback(
        async (application: ApplicationInfo, action: 'approve' | 'reject') =>
        {
            setAction(action);
            setOpen(true);

            setApplication({
                firstName: application.firstName,

                userId: application.userId,
                eventId: event.id,
                teamId: team.id,
            });

        }, [ event, setAction, setApplication, setOpen, team ]);

    if (!applications.length)
        return <NoApplications />;

    return (
        <>
            <Grid container spacing={2} sx={{ m: '8px -8px -8px -8px !important' }}>
                { applications.map((application, index) =>
                    <Grid key={index} xs={6}>
                        <Application application={application} requestResponse={requestResponse} />
                    </Grid> )}
            </Grid>
            <ApplicationResponseDialog open={open} action={action} application={application}
                                       onClose={ () => setOpen(false) } />
        </>
    );
}
