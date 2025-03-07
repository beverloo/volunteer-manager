// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import Stack from '@mui/material/Stack';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { type RegistrationStatus, kRegistrationStatus } from '@lib/database/Types';
import { Avatar } from '@components/Avatar';
import { CommunicationDialog } from '@app/admin/components/CommunicationDialog';
import { PlaceholderPaper } from '@app/admin/components/PlaceholderPaper';
import { Temporal, formatDate } from '@lib/Temporal';
import { callApi } from '@lib/callApi';

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
    date?: string;

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

    /**
     * Whether the person who applied has been suspended from participating. The option to approve
     * their participation will be disabled.
     */
    suspended?: string;
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
     * Whether this volunteer is able to access account information.
     */
    canAccessAccounts?: boolean;

    /**
     * Requests for the application to be approved or rejected. The volunteer won't be offered the
     * option to respond to this application if this prop is missing.
     */
    requestResponse?: (application: ApplicationInfo, action: 'approve' | 'reject') => void;
}

/**
 * The <Application> component displays an individual application that can be inspected, and then
 * either approved or rejected. Not all volunteers are allowed to manage applications.
 */
function Application(props: ApplicationProps) {
    const { application, canAccessAccounts, requestResponse } = props;

    const avatarUrl = application.avatar ? `/blob/${application.avatar}.png` : undefined;
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

    let accountAction: React.JSX.Element | undefined;
    if (!!canAccessAccounts) {
        const href = `/admin/volunteers/${application.userId}`;

        accountAction = (
            <IconButton component={Link} href={href} sx={{ mt: 1, mr: 1 }}>
                <Tooltip title="Account information">
                    <PersonSearchIcon />
                </Tooltip>
            </IconButton>
        );
    }

    const applicationDate =
        Temporal.ZonedDateTime.from(application.date!).withTimeZone(Temporal.Now.timeZoneId());

    return (
        <Stack component={Paper} direction="column" sx={{ minHeight: '100%' }}>
            <CardHeader avatar={avatar}
                        action={accountAction}
                        titleTypographyProps={{ variant: 'subtitle1' }}
                        title={`${application.firstName} ${application.lastName}`}
                        subheader={formatDate(applicationDate, 'dddd, MMMM D, YYYY')} />
            <Divider />
            <CardContent sx={{ flex: 1, py: '0 !important' }}>
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
            { !!requestResponse &&
                <>
                    <Divider />
                    <CardActions disableSpacing sx={{ justifyContent: 'flex-end', gap: 2 }}>
                        { !!application.suspended &&
                            <Typography color="error" variant="body2" sx={{ flexGrow: 1, px: 1 }}>
                                This volunteer has been suspended
                            </Typography> }
                        <Button size="small" color="error" startIcon={ <ThumbDownIcon /> }
                                onClick={ () => requestResponse(application, 'reject') }>
                            Reject
                        </Button>
                        <Button size="small" color="success" startIcon={ <ThumbUpIcon /> }
                                disabled={!!application.suspended}
                                onClick={ () => requestResponse(application, 'approve') }>
                            Approve
                        </Button>
                    </CardActions>
                </> }
        </Stack>
    );
}

/**
 * Props accepted by the <Applications> component.
 */
interface ApplicationsProps {
    /**
     * Whether sending out a communication can be skipped altogether. Should be guarded behind a
     * permission, and should ideally be used rarely.
     */
    allowSilent?: boolean;

    /**
     * The applications that are currently pending a response.
     */
    applications: ApplicationInfo[];

    /**
     * Whether this volunteer is able to access account information.
     */
    canAccessAccounts?: boolean;

    /**
     * Whether the signed in volunteer has the ability to manage applications.
     */
    canManageApplications?: boolean;

    /**
     * Slug of the event for which application metadata is being shown.
     */
    event: string;

    /**
     * Slug of the team that this application is part of.
     */
    team: string;
}

/**
 * The <Applications> component displays the pending applications which this volunteering team has
 * not yet responded to. Basic information is shown, and a decision can be made on this page by
 * event administrators and folks with the application management permissions.
 */
export function Applications(props: ApplicationsProps) {
    const { allowSilent, applications, canAccessAccounts, canManageApplications, event, team }
        = props;

    const router = useRouter();

    const [ approveOpen, setApproveOpen ] = useState<boolean>(false);
    const [ rejectOpen, setRejectOpen ] = useState<boolean>(false);

    const [ application, setApplication ] = useState<{
        firstName: string,
        userId: number,
    }>();

    const doRequestResponse = useCallback(
        async (application: ApplicationInfo, action: 'approve' | 'reject') => {
            setApplication({
                firstName: application.firstName,
                userId: application.userId,
            });

            setApproveOpen(action === 'approve');
            setRejectOpen(action === 'reject');
        }, [ /* no deps */ ]);

    const requestResponse = canManageApplications ? doRequestResponse : undefined;

    // ---------------------------------------------------------------------------------------------
    // Mechanisms for approving and rejecting applications
    // ---------------------------------------------------------------------------------------------

    const handleDecided = useCallback(
        async (status: RegistrationStatus, subject?: string, message?: string) => {
            if (!application)
                return { error: 'Lost context of the selected application, please try again' };

            const response = await callApi('put', '/api/application/:event/:team/:userId', {
                event,
                team,
                userId: application.userId,

                status: {
                    registrationStatus: status,
                    subject, message
                },
            });

            if (response.success) {
                router.refresh();
                return { success: 'Your decision has been processed, thanks!' };
            } else {
                return { error: 'Something went wrong when processing your decision. Try again?' };
            }
        }, [ application, event, router, team ]);

    const handleApproveClose = useCallback(() => setApproveOpen(false), [ /* no deps */ ]);
    const handleApproved = useCallback((subject?: string, message?: string) =>
        handleDecided(kRegistrationStatus.Accepted, subject, message), [ handleDecided ]);

    const handleRejectClose = useCallback(() => setRejectOpen(false), [ /* no deps */ ]);
    const handleRejected = useCallback((subject?: string, message?: string) =>
        handleDecided(kRegistrationStatus.Rejected, subject, message), [ handleDecided ]);

    if (!applications.length)
        return <NoApplications />;

    return (
        <>
            <Grid container spacing={2} alignItems="stretch">
                { applications.map((application, index) =>
                    <Grid key={index} size={{ xs: 6 }}>
                        <Application application={application} canAccessAccounts={canAccessAccounts}
                                     requestResponse={requestResponse} />
                    </Grid> )}
            </Grid>

            <CommunicationDialog title={`Approve ${application?.firstName}'s application`}
                                 open={approveOpen} onClose={handleApproveClose}
                                 confirmLabel="Approve" allowSilent={allowSilent} description={
                                     <>
                                         You're about to approve
                                         <strong> {application?.firstName}</strong>'s application to
                                         help out during this event. An e-mail will automatically be
                                         sent to let them know.
                                     </>
                                 } apiParams={{
                                     type: 'approve-volunteer',
                                     approveVolunteer: {
                                         userId: application?.userId ?? 0,
                                         event, team,
                                     },
                                 }} onSubmit={handleApproved} />

            <CommunicationDialog title={`Reject ${application?.firstName}'s application`}
                                 open={rejectOpen} onClose={handleRejectClose}
                                 confirmLabel="Reject" allowSilent={allowSilent} description={
                                     <>
                                         You're about to reject
                                         <strong> {application?.firstName}</strong>'s application to
                                         help out during this event. An e-mail will automatically be
                                         sent to let them know.
                                     </>
                                 } apiParams={{
                                     type: 'reject-volunteer',
                                     rejectVolunteer: {
                                         userId: application?.userId ?? 0,
                                         event, team,
                                     },
                                 }} onSubmit={handleRejected} />

        </>
    );
}
