// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Alert from '@mui/material/Alert';

import type { Activity, ActivityType, FloorApi, Timeslot }
    from '@lib/integrations/animecon/AnimeConTypes';

import type { AnimeConClientSettings } from '@lib/integrations/animecon/AnimeConClient';
import { createAnimeConClient } from '@lib/integrations/animecon';
import TextField from '@mui/material/TextField';

/**
 * Festival Id filter to apply to the `activities` endpoint.
 */
const kActivitiesFestivalIdFilter = /* AnimeCon 2023= */ 624;

/**
 * Year filter to apply to the `timeslots` endpoint.
 */
const kTimeslotsYearFilter = 2023;

/**
 * Props accepted by the <AnimeConStreamingApiResult> component.
 */
export interface AnimeConStreamingApiResultProps {
    /**
     * Endpoint of the API call to issue to the AnimeCon API.
     */
    endpoint: 'activities.json' | 'activity-types.json' | 'floors.json' | 'timeslots.json';

    /**
     * Client settings to use when querying the AnimeCon client.
     */
    settings?: AnimeConClientSettings;
}

/**
 * The <AnimeConStreamingApiResult> component issues an API call to the AnimeCon API and will
 * display the API's results in an autosizing textarea.
 */
export async function AnimeConStreamingApiResult(props: AnimeConStreamingApiResultProps) {
    const client = await createAnimeConClient(props.settings);
    let stringifiedResult: string | undefined;

    try {
        let result: Activity[] | ActivityType[] | FloorApi[] | Timeslot[];
        switch (props.endpoint) {
            case 'activities.json':
                result = await client.getActivities({ festivalId: kActivitiesFestivalIdFilter });
                break;

            case 'activity-types.json':
                result = await client.getActivityTypes();
                break;

            case 'floors.json':
                result = await client.getFloors();
                break;

            case 'timeslots.json':
                result = await client.getTimeslots({ 'activity.year': kTimeslotsYearFilter });
                break;

            default:
                throw new Error('Endpoint not recognised by the Volunteer Manager');
        }

        stringifiedResult = JSON.stringify(result, /* replacer= */ undefined, /* space= */ 4);

    } catch (error: any) {
        return (
            <Alert severity="error">
                Unable to request the <strong>{props.endpoint}</strong> API: {error.message}
            </Alert>
        );
    }

    return (
        <TextField multiline fullWidth size="small" minRows={3} maxRows={16}
                   value={stringifiedResult} />
    );
}
