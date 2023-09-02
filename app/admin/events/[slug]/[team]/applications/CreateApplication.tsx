// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, FormContainer, useForm } from 'react-hook-form-mui';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import SaveIcon from '@mui/icons-material/Save';
import Stack from '@mui/material/Stack';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { PageInfoWithTeam } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { UserData } from '@lib/auth/UserData';
import type { VolunteerListDefinition } from '@app/api/admin/volunteerList';
import { ApplicationParticipation } from '@app/registration/[[...path]]/ApplicationParticipation';
import { callApi } from '@lib/callApi';
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

    const { excludeEventId, onVolunteerSelected, ...rest } = props;

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
            const removeDuplicateMap = new Map<string, number>();

            // The <Autocomplete> component trips over items with duplicate labels as they're used
            // for the @key attribute, so add suffices to duplicated names.
            for (const volunteer of volunteers) {
                const duplicate = removeDuplicateMap.get(volunteer.name);
                if (!duplicate) {
                    removeDuplicateMap.set(volunteer.name, 1);
                    continue;
                }

                removeDuplicateMap.set(volunteer.name, duplicate + 1);
                volunteer.name += ` (${duplicate + 1 })`;
            }

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
                      getOptionDisabled={ (option) => !!option.disabled } clearOnEscape
                      getOptionLabel={ (option) => option.name }
                      options={volunteers} loading={loading} onChange={onChange}
                      renderInput={ (params) => (
                          <TextField {...params} {...rest}
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
 * Default values to initialize the application form with.
 */
const kDefaultApplicationValues = {
    serviceHours: '16',
    serviceTiming: '10-0',
};

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

    const formContext = useForm({ defaultValues: kDefaultApplicationValues });
    const { reset } = formContext;

    const router = useRouter();

    const [ error, setError ] = useState<string>();
    const [ loading, setLoading ] = useState<boolean>(false);

    const requestSubmit = useCallback(async (data: FieldValues) => {
        if (!selectedUserId)
            return;  // this should not happen

        setLoading(true);
        try {
            const response = await callApi('post', '/api/events/application', {
                availability: true,
                credits: true,
                environment: props.team.slug,
                event: props.event.slug,
                preferences: data.preferences,
                serviceHours: data.serviceHours,
                serviceTiming: data.serviceTiming,
                socials: true,
                tshirtFit: data.tshirtFit,
                tshirtSize: data.tshirtSize,
                adminOverride: {
                    userId: selectedUserId,
                },
            });

            if (!response.success) {
                setError(response.error);
            } else {
                setSelectedUserId(/* none= */ undefined);
                reset(kDefaultApplicationValues);

                router.refresh();
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ props, reset, router, selectedUserId, setError, setSelectedUserId ]);

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
            <FormContainer formContext={formContext} onSuccess={requestSubmit}>
                <VolunteerAutocompleteTextField variant="outlined" name="volunteerId"
                                                label="Volunteer" size="small" autoComplete="off"
                                                excludeEventId={props.event?.id}
                                                onVolunteerSelected={onVolunteerSelected} />
                <Collapse in={!!selectedUserId}>
                    <ApplicationParticipation sx={{ pt: 2 }} />
                    <Stack direction="row" spacing={2} sx={{ mt: 1, py: 1 }} alignItems="center">
                        <LoadingButton loading={loading} startIcon={ <SaveIcon /> } type="submit"
                                       variant="contained">
                            Create application
                        </LoadingButton>
                        <Typography variant="body2" color="error.main">
                            {error}
                        </Typography>
                    </Stack>
                </Collapse>
            </FormContainer>
        </Paper>
    );
}
