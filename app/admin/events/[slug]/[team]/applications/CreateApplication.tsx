// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useState } from 'react';

import { type FieldValues, FormContainer, TextFieldElement } from 'react-hook-form-mui';

import Alert from '@mui/material/Alert';
import Autocomplete, { type AutocompleteProps } from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { PageInfoWithTeam } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { UserData } from '@lib/auth/UserData';
import type { VolunteerListDefinition } from '@app/api/admin/volunteerList';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Props accepted by the <VolunteerAutocompleteTextField> component.
 */
interface VolunteerAutocompleteTextFieldProps extends TextFieldProps<'outlined'> {
    /**
     * Internal ID of the event for which existing candidates should be omitted.
     */
    excludeEventId?: number;

    /**
     * Called when the input field's value has changed and a volunteer has been selected. When the
     * `userId` is set to undefined, the value was cleared instead.
     */
    onVolunteerSelected?: (userId?: number) => void;
}

/**
 * The <VolunteerAutocompleteTextField> component lazy loads volunteer names when the autocomplete
 * is being requested. Only volunteers who are not yet participating in this event can join.
 */
function VolunteerAutocompleteTextField(props: VolunteerAutocompleteTextFieldProps) {
    interface Volunteer {
        userId: number;
        name: string;
        disabled?: boolean;
    }

    const { excludeEventId, onVolunteerSelected } = props;

    const [ fetching, setFetching ] = useState<boolean>(false);
    const [ open, setOpen ] = useState<boolean>(false);
    const [ volunteers, setVolunteers ] = useState<readonly Volunteer[]>([]);

    const loading = open && !volunteers.length;

    useEffect(() => {
        if (fetching || !open || volunteers.length > 0)
            return;

        setFetching(true);

        issueServerAction<VolunteerListDefinition>('/api/admin/volunteer-list', {
            excludeEventId
        }).then(({ volunteers }) => {
            setVolunteers(volunteers);
        });

    }, [ excludeEventId, fetching, open, setFetching, setVolunteers, volunteers ]);

    const onChange = useCallback((event: unknown, value: Volunteer | null) => {
        if (onVolunteerSelected)
            onVolunteerSelected(value?.userId);
    }, [ onVolunteerSelected ]);

    return (
        <Autocomplete open={open} onOpen={ () => setOpen(true) } onClose={ () => setOpen(false) }
                      isOptionEqualToValue={ (option, value) => option.userId === value.userId }
                      getOptionDisabled={ (option) => !!option.disabled }
                      getOptionLabel={ (option) => option.name }
                      options={volunteers} loading={loading} onChange={onChange}
                      renderInput={ (params) => (
                          <TextField {...params} {...props}
                                     InputProps={{
                                         ...params.InputProps,
                                         endAdornment: (
                                             <>
                                                 { loading &&
                                                    <CircularProgress color="inherit" size={20} /> }
                                                 { params.InputProps.endAdornment }
                                             </>
                                         )
                                     }} />
                      )} />
    );
}

/**
 * Props accepted by the <CreateApplication> component.
 */
export interface CreateApplicationProps {
    /**
     * Information about the event for which applications are being shown.
     */
    event: PageInfoWithTeam['event'];

    /**
     * Information about the team for which applications are being shown.
     */
    team: PageInfoWithTeam['team'];

    /**
     * The user who is signed in to their account.
     */
    user: UserData;
}

/**
 * The <CreateApplication> component allows event administrators to create applications whenever
 * there is a need to do so on the spot. These applications will be treated exactly the same as any
 * other incoming registration, just without action on behalf of the volunteer.
 */
export function CreateApplication(props: CreateApplicationProps) {
    const [ selectedUserId, setSelectedUserId ] = useState<number>();

    const onVolunteerSelected = useCallback((userId?: number) => {
        setSelectedUserId(userId);
    }, [ setSelectedUserId ]);

    const requestSubmit = useCallback(async (data: FieldValues) => {
        // TODO: Implement this function.
    }, [ selectedUserId ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
                Create a new application
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
                This mechanism enables you to instantly create an application on behalf of any
                registered user, which means that <strong>you</strong> are responsible for the
                correctness of the information. The application will still have to be accepted,
                which will automatically inform them.
            </Alert>
            <FormContainer>
                <VolunteerAutocompleteTextField variant="outlined" name="volunteerId"
                                                label="Volunteer" size="small" autoComplete="off"
                                                excludeEventId={props.event?.id}
                                                onVolunteerSelected={onVolunteerSelected} />
                <Collapse in={!!selectedUserId}>
                    userId: {selectedUserId}
                </Collapse>
            </FormContainer>
        </Paper>
    );
}
