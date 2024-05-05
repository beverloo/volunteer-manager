// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { FormContainer, TextareaAutosizeElement, type FieldValues } from 'react-hook-form-mui';

import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <VolunteerNotes> component.
 */
export interface VolunteerNotesProps {
    /**
     * Slug of the event for which a volunteer is being displayed.
     */
    event: string;

    /**
     * Slug of the team that the volunteer is part of.
     */
    team: string;

    /**
     * Information about the volunteer themselves.
     */
    volunteer: {
        /**
         * Unique ID of the volunteer
         */
        userId: number;

        /**
         * Notes associated with the volunteer and their participation.
         */
        registrationNotes?: string;
    };
}

/**
 * The <VolunteerNotes> component displays a form in which the volunteer's notes can be read and
 * changed. The same information is available in the scheduling app.
 */
export function VolunteerNotes(props: VolunteerNotesProps) {
    const { event, team, volunteer } = props;

    const router = useRouter();

    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        try {
            const response = await callApi('put', '/api/application/:event/:team/:userId', {
                event,
                team,
                userId: volunteer.userId,

                notes: data.notes,
            });

            if (response.success) {
                setInvalidated(false);
                router.refresh();
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ event, router, team, volunteer.userId ]);

    return (
        <FormContainer defaultValues={{ notes: volunteer.registrationNotes }}
                       onSuccess={handleSubmit}>
            <TextareaAutosizeElement name="notes" fullWidth size="small"
                                     onChange={handleChange} />
            <SubmitCollapse error={error} open={invalidated} loading={loading} sx={{ mt: 2 }} />
        </FormContainer>
    );
}
