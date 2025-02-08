// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useMemo } from 'react';

import { SelectElement } from '@proxy/react-hook-form-mui';

/**
 * Props accepted by the <TrainingPreferencesForm> component.
 */
interface TrainingPreferencesFormProps {
    /**
     * Callback to be invoked when the value of one of the form fields has changed.
     */
    onChange?: () => void;

    /**
     * Whether the form should be marked as read-only, useful in case their participation has been
     * confirmed. Changes can only be made after that by e-mailing our team.
     */
    readOnly?: boolean;

    /**
     * Options for trainings that can be presented to the user, inclusive of their label, but
     * exclusive of the "Skip" option.
     */
    trainingOptions: { id: number; label: string; }[];
}

/**
 * The <TrainingPreferencesForm> component will display the actual form where volunteers can share
 * their preferences. The form will be re-used for training managers, who have the ability to update
 * preferences on behalf of volunteers.
 */
export function TrainingPreferencesForm(props: TrainingPreferencesFormProps) {
    const { onChange, readOnly } = props;

    const trainingOptions = useMemo(() => {
        return [
            { id: 0, label: 'I would like to skip the training this year' },
            ...props.trainingOptions,
        ];
    }, [ props.trainingOptions ]);

    return (
        <SelectElement name="training" label="Would you like to participate?"
                       options={trainingOptions} fullWidth size="small" required
                       onChange={onChange} disabled={readOnly} />
    );
}
