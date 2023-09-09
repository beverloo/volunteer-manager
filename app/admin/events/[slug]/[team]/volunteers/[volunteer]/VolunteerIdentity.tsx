// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useState } from 'react';

import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import PhoneIcon from '@mui/icons-material/Phone';
import Popover from '@mui/material/Popover';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import type { VolunteerContactInfoDefinition } from '@app/api/admin/volunteerContactInfo';
import { Avatar } from '@components/Avatar';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Displays a loading skeleton to inform the user that contact information has not been loaded yet.
 */
function ContactInfoLoadingSkeleton() {
    return (
        <Box sx={{ p: 2, width: '240px' }}>
            <Skeleton variant="text" animation="wave" width="80%" height={10} />
            <Skeleton variant="text" animation="wave" width="90%" height={10} />
        </Box>
    );
}

/**
 * Contact information that can be made available for a volunteer.
 */
interface ContactInfo {
    username?: string;
    phoneNumber?: string;
}

/**
 * Props accepted by the <VolunteerIdentity> component.
 */
export interface VolunteerIdentityProps {
    /**
     * ID of the event, team and user for whom this box is being displayed.
     */
    eventId: number;
    teamId: number;
    userId: number;

    contactInfo?: ContactInfo;
    volunteer: {
        firstName: string;
        lastName: string;
        avatarFileHash?: string;
        roleName: string;
    },
}

/**
 * The <VolunteerIdentity> displays a narrow paper containing the volunteer's identity, i.e. their
 * avatar, name, role and some basic other information.
 */
export function VolunteerIdentity(props: VolunteerIdentityProps) {
    const { eventId, teamId, userId, volunteer } = props;

    const [ contactInfo, setContactInfo ] = useState<ContactInfo | undefined>(props.contactInfo);
    const [ contactInfoLoading, setContactInfoLoading ] = useState<boolean>(false);

    const [ emailAnchorEl, setEmailAnchorEl ] = useState<HTMLElement | null>(null);
    const [ phoneNumberAnchorEl, setPhoneNumberAnchorEl ] = useState<HTMLElement | null>(null);

    const handleEmailClose = useCallback(() => setEmailAnchorEl(null), [ /* deps */ ]);
    const handleEmailOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setEmailAnchorEl(event.currentTarget);
    }, []);

    const handlePhoneNumberClose = useCallback(() => setPhoneNumberAnchorEl(null), [ /* deps */ ]);
    const handlePhoneNumberOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setPhoneNumberAnchorEl(event.currentTarget);
    }, []);

    useEffect(() => {
        if (!!contactInfo || contactInfoLoading)
            return;  // the contact information is already (being) loaded

        if (!emailAnchorEl && !phoneNumberAnchorEl)
            return;  // contact information hasn't been requested

        setContactInfoLoading(true);
        issueServerAction<VolunteerContactInfoDefinition>(
            '/api/admin/volunteer-contact-info', { eventId, teamId, userId }).then(response =>
        {
            setContactInfo(response);
        });

    }, [ contactInfo, contactInfoLoading, emailAnchorEl, eventId, phoneNumberAnchorEl, teamId,
         userId ])

    const avatarSrc =
        volunteer.avatarFileHash ? `/blob/${volunteer.avatarFileHash}.png` : undefined;

    return (
        <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center"
                    divider={ <Divider orientation="vertical" flexItem /> }>
                    <Avatar src={avatarSrc}>
                        {volunteer.firstName} {volunteer.lastName}
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1">
                            {volunteer.firstName} {volunteer.lastName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'action.active' }}>
                            {volunteer.roleName}
                        </Typography>
                    </Box>
                    { /* TODO: Display past participation */ }
                </Stack>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="E-mail address">
                        <IconButton onClick={handleEmailOpen}>
                            <AlternateEmailIcon color="primary" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Phone number">
                        <IconButton onClick={handlePhoneNumberOpen}>
                            <PhoneIcon color="primary" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>
            <Popover open={!!emailAnchorEl} anchorEl={emailAnchorEl} onClose={handleEmailClose}
                     anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                     transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                { !contactInfo && <ContactInfoLoadingSkeleton /> }
                { !!contactInfo &&
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2 }}>
                        <TextField name="emailAddress" label="E-mail address"
                                value={contactInfo.username} size="small"
                                InputProps={{ readOnly: true }} />
                        { contactInfoLoading &&
                            <Tooltip title="Treat personal information carefully">
                                <WarningAmberIcon color="warning" />
                            </Tooltip> }
                    </Stack> }
            </Popover>
            <Popover open={!!phoneNumberAnchorEl} anchorEl={phoneNumberAnchorEl}
                     onClose={handlePhoneNumberClose}
                     anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                     transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                { !contactInfo && <ContactInfoLoadingSkeleton /> }
                { !!contactInfo &&
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2 }}>
                        <TextField name="phoneNumber" label="Phone number"
                                value={contactInfo.phoneNumber} size="small"
                                InputProps={{ readOnly: true }} />
                        { contactInfoLoading &&
                            <Tooltip title="Treat personal information carefully">
                                <WarningAmberIcon color="warning" />
                            </Tooltip> }
                    </Stack> }
            </Popover>
        </Paper>
    );
}