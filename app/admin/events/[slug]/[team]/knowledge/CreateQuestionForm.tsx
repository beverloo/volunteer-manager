// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, FormContainer, TextFieldElement } from 'react-hook-form-mui';

import type { ContentScope } from '@app/api/admin/content/[[...id]]/route';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { callApi } from '@lib/callApi';
import { nanoid } from '@lib/nanoid';

/**
 * Props accepted by the <CreateQuestionForm> component.
 */
export interface CreateQuestionFormProps {
    /**
     * Scope that should be used for sourcing the knowledge.
     */
    scope: ContentScope;
}

/**
 * The <CreateQuestionForm> component makes it possible to add new questions to the knowledge base.
 * Only the question is necessary—the answer can be filled in by to volunteer after the fact.
 */
export function CreateQuestionForm(props: CreateQuestionFormProps) {
    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const router = useRouter();

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        try {
            const response = await callApi('post', '/api/admin/content', {
                context: props.scope,
                row: {
                    path: nanoid(/* size= */ 8),
                    title: data.question,
                },
            });

            if (response.success)
                router.push(`./faq/${response.row.id}`);
            else
                setError(response.error ?? 'Unable to create the new question');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ props.scope, router ]);

    return (
        <FormContainer onSuccess={handleSubmit}>
            <TextFieldElement name="question" label="Question…" fullWidth size="small"
                              onChange={handleChange} />
            <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
        </FormContainer>
    );
}
