// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../../createDataTableApi';
import { ActivityType } from '@lib/database/Types';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getAnPlanLocationUrl } from '@lib/AnPlan';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tActivitiesLocations } from '@lib/database';

/**
 * Row model of a program's location.
 */
const kProgramLocationRowModel = z.object({
    /**
     * Unique ID of this location.
     */
    id: z.number(),

    /**
     * Type of location this entails, i.e. sourced from AnPlan or internal to our system.
     */
    type: z.nativeEnum(ActivityType),

    /**
     * Name of the location, which does not have to be its display name.
     */
    name: z.string(),

    /**
     * Display name of the location, as it should be presented to volunteers.
     */
    displayName: z.string().optional(),

    /**
     * Unique ID of the area that this location is located in.
     */
    area: z.number(),

    /**
     * Link to this location in AnPlan, when one exists and can be created.
     */
    anplanLink: z.string().optional(),
});

/**
 * Program locations are specific to a given festival.
 */
const kProgramLocationContext = z.object({
    context: z.object({
        /**
         * Name of the event which is being consulted.
         */
        event: z.string(),
    }),
});

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type ProgramLocationsEndpoints =
    DataTableEndpoints<typeof kProgramLocationRowModel, typeof kProgramLocationContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type ProgramLocationsRowModel = z.infer<typeof kProgramLocationRowModel>;

/**
 * Export type definition for the API's context.
 */
export type ProgramLocationsContext = z.infer<typeof kProgramLocationContext>;

/**
 * The Program Locations API is implemented as a regular DataTable API.
 * The following endpoints are provided by this implementation:
 *
 *     DELETE /api/admin/program/locations/:id
 *     GET    /api/admin/program/locations
 *     GET    /api/admin/program/locations/:id
 *     POST   /api/admin/program/locations
 *     PUT    /api/admin/program/locations/:id
 *
 */
export const { GET } = createDataTableApi(kProgramLocationRowModel, kProgramLocationContext, {
    async accessCheck({ context }, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: context.event,
        });
    },

    async create({ context, row }) {
        const event = await getEventBySlug(context.event);
        if (!event || !event.festivalId)
            notFound();

        return {
            success: false,
            error: 'Not yet implemented',
        };
    },

    async delete({ context, id }) {
        const event = await getEventBySlug(context.event);
        if (!event || !event.festivalId)
            notFound();

        return {
            success: false,
            error: 'Not yet implemented',
        };
    },

    async get({ context, id }) {
        const event = await getEventBySlug(context.event);
        if (!event || !event.festivalId)
            notFound();

        return {
            success: false,
            error: 'Not yet implemented',
        };
    },

    async list({ context, sort }) {
        const event = await getEventBySlug(context.event);
        if (!event || !event.festivalId)
            notFound();

        let sortingKey: 'id' | 'type' | 'name' | 'displayName' | 'area' | undefined;
        switch (sort?.field) {
            case 'id':
            case 'type':
            case 'name':
            case 'displayName':
            case 'area':
                sortingKey = sort.field;
                break;
        }

        const locations = await db.selectFrom(tActivitiesLocations)
            .where(tActivitiesLocations.locationFestivalId.equals(event.festivalId))
                .and(tActivitiesLocations.locationDeleted.isNull())
            .select({
                id: tActivitiesLocations.locationId,
                type: tActivitiesLocations.locationType,
                name: tActivitiesLocations.locationName,
                displayName: tActivitiesLocations.locationDisplayName,
                area: tActivitiesLocations.locationAreaId,
            })
            .orderBy(sortingKey ?? 'name', sort?.sort ?? 'desc')
            .executeSelectPage();

        return {
            success: true,
            rowCount: locations.count,
            rows: locations.data.map(location => ({
                ...location,
                anplanLink: getAnPlanLocationUrl(location.id),
            })),
        };
    },

    async update({ context, id, row }) {
        const event = await getEventBySlug(context.event);
        if (!event || !event.festivalId)
            notFound();

        return {
            success: false,
            error: 'Not yet implemented',
        };
    },
});

export const dynamic = 'force-dynamic';
