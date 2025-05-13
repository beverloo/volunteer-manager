// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useMemo } from 'react';

import { TextFieldElement } from '@app/components/proxy/react-hook-form-mui';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { ServerAction } from '@lib/serverAction';
import { FormGrid } from '@app/admin/components/FormGrid';

/**
 * Maximum number of examples messages that can be provided by the user.
 */
const kExampleMessageCount = 5;

/**
 * Props accepted by the <AccountSettings> component.
 */
interface AccountSettingsProps {
    /**
     * Server action that can be called to update the stored account settings.
     */
    updateAccountSettingsFn: ServerAction;

    /**
     * Zero or more example messages that can be provided to improve Generated AI performance.
     */
    exampleMessages: string[];
}

/**
 * The <AccountSettings> component displays a set of settings owned by a particular account. Such
 * settings will be stored in UserSettings.
 */
export function AccountSettings(props: AccountSettingsProps) {
    const defaultValues = useMemo(() => ({
        exampleMessages: props.exampleMessages,
    }), [ props.exampleMessages ]);

    return (
        <FormGrid action={props.updateAccountSettingsFn} defaultValues={defaultValues}>
            <Grid size={{ xs: 3 }}>
                <Typography variant="subtitle2" sx={{ pt: 0 }}>
                    Example messages
                </Typography>
                <Typography variant="body2">
                    Include three to five examples of e-mail messages you've written to help AI do
                    a better job for you. Includes messages in both Dutch and English.
                </Typography>
            </Grid>
            <Grid size={{ xs: 9 }}>
                <Stack direction="column" spacing={2}>
                    { Array(kExampleMessageCount).fill(null).map((_, index) =>
                        <TextFieldElement key={index} name={`exampleMessages[${index}]`}
                                          label={`Example message ${index + 1}`}
                                          fullWidth size="small" /> ) }
                </Stack>
            </Grid>
        </FormGrid>
    );
}
