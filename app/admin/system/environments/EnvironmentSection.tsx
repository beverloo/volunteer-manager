// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { SelectElement, TextFieldElement, TextareaAutosizeElement }
    from '@components/proxy/react-hook-form-mui';

import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import PublicIcon from '@mui/icons-material/Public';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ColorFieldElement } from '@app/admin/volunteers/teams/Team';
import { EnvironmentPurpose } from '@lib/database/Types';
import { FormGridSection } from '@app/admin/components/FormGridSection';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { executeServerAction } from '@lib/serverAction';
import db, { tEnvironments } from '@lib/database';

/**
 * The data associated with a particular environment.
 */
const kEnvironmentSettings = z.object({
    /**
     * Colours that decide the appearance of this environment, both in dark- and light mode.
     */
    colours: z.object({
        dark: z.string().regex(/^#[0-9A-F]{6}$/i, 'Dark mode colour needs to be #RRGGBB'),
        light: z.string().regex(/^#[0-9A-F]{6}$/i, 'Light mode colour needs to be #RRGGBB'),
    }),

    /**
     * Description that details what this environment is used for. Presented to users.
     */
    description: z.string().min(1),

    /**
     * Purpose that the environment fulfils, i.e. what should happen when you visit the domain?
     */
    purpose: z.nativeEnum(EnvironmentPurpose),

    /**
     * Title that briefly details what this environment is used for.
     */
    title: z.string().min(1),
});

/**
 * Server Action called when the environment settings are being updated.
 */
async function updateEnvironmentSettings(id: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kEnvironmentSettings, async (data, props) => {
        props.access.require('system.internals');

        const affectedRows = await db.update(tEnvironments)
            .set({
                environmentColourDarkMode: data.colours.dark,
                environmentColourLightMode: data.colours.light,
                environmentDescription: data.description,
                environmentPurpose: data.purpose,
                environmentTitle: data.title,
            })
            .where(tEnvironments.environmentId.equals(id))
            .executeUpdate();

        if (!!affectedRows) {
            await Log({
                type: LogType.AdminUpdateEnvironment,
                severity: LogSeverity.Warning,
                sourceUser: props.user,
            });
        }

        return { success: !!affectedRows };
    });
}

/**
 * Options that will be presented to the user regarding the purpose of this environment.
 */
const kEnvironmentPurposeOptions = [
    { id: EnvironmentPurpose.LandingPage, label: 'Landing page (default)' },
];

/**
 * Props accepted by the <EnvironmentSection> component.
 */
interface EnvironmentSectionProps extends z.infer<typeof kEnvironmentSettings> {
    /**
     * Unique ID of this environment as it exists in the database.
     */
    id: number;

    /**
     * Domain name that this environment is represented by.
     */
    domain: string;

    /**
     * The teams that are part of this environment. There may be none.
     */
    teams: {
        name: string;
        slug: string;
    }[];
}

/**
 * The <EnvironmentSection> displays and manages updates for a particular environment, as indicated
 * in the given `props`. Updates will be sent to a React server action.
 */
export function EnvironmentSection(props: EnvironmentSectionProps) {
    const action = updateEnvironmentSettings.bind(null, props.id);

    return (
        <FormGridSection action={action} defaultValues={props} title={props.domain}
                         icon={ <PublicIcon htmlColor={props.colours.light} /> }>
            <Grid xs={6}>
                <TextFieldElement name="domain" label="Domain" fullWidth size="small" disabled />
            </Grid>
            <Grid xs={6}>
                <SelectElement name="purpose" label="Purpose" fullWidth size="small"
                               options={kEnvironmentPurposeOptions} />
            </Grid>
            <Grid xs={6}>
                <ColorFieldElement name="colours.dark" label="Dark mode colour" size="small" />
            </Grid>
            <Grid xs={6}>
                <ColorFieldElement name="colours.light" label="Light mode colour" size="small" />
            </Grid>
            <Grid xs={12}>
                <TextFieldElement name="title" label="Title" fullWidth size="small" />
            </Grid>
            <Grid xs={12}>
                <TextareaAutosizeElement name="description" label="Description"
                                         fullWidth size="small" />
            </Grid>
            { props.teams.length > 0 &&
                <>
                    <Grid xs={12}>
                        <Divider />
                    </Grid>
                    <Grid xs={12}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography variant="body2">
                                <strong>Teams</strong>:
                            </Typography>
                            { /* TODO: Linkify the team to the team settings page, when allowed */ }
                            { /* TODO: Display the team chip in the team's identity colour */ }
                            { props.teams.map(team =>
                                <Chip key={team.slug} label={team.name} size="small" /> )}
                        </Stack>
                    </Grid>
                </> }
        </FormGridSection>
    );
}
