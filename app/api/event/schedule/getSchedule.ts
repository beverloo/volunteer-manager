// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';
import { notFound } from 'next/navigation';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { ActivityType, ContentType } from '@lib/database/Types';
import { Temporal, isAfter, isBefore } from '@lib/Temporal';
import { getEventBySlug } from '@lib/EventLoader';
import { readSettings } from '@lib/Settings';

import db, { tActivities, tActivitiesAreas, tActivitiesLocations, tActivitiesTimeslots, tContent,
    tContentCategories } from '@lib/database';

/**
 * Interface definition for the information contained within a public schedule.
 */
const kPublicSchedule = z.strictObject({
    /**
     * Unique slug of the event for which the schedule is being shown.
     */
    slug: z.string(),

    /**
     * Configuration that should be conveyed to the client. Affects behaviour of the schedule app.
     */
    config: z.strictObject({
        /**
         * Whether the knowledge base should be enabled.
         */
        enableKnowledgeBase: z.boolean(),

        /**
         * Amount of fuzziness to apply to the search results. While this allows minor compensation
         * for typos, a high value could lead to less relevant results being presented to the user.
         */
        searchResultFuzziness: z.number(),

        /**
         * Maximum number of inline search results to show at once.
         */
        searchResultLimit: z.number(),

        /**
         * Minimum search score required for a result to be considered for presentation to the user.
         */
        searchResultMinimumScore: z.number(),
    }),

    /**
     * The event's kwowledge base, however, without the answers. These will be loaded on demand.
     */
    knowledge: z.array(z.strictObject({
        /**
         * Unique ID of the knowledge base category.
         */
        id: z.number(),

        /**
         * Name of the icon using which the category should be represented.
         */
        icon: z.string(),

        /**
         * Title of the category, to be used in the user interface.
         */
        title: z.string(),

        /**
         * Description of the category, to be used in the user interface.
         */
        description: z.string().optional(),

        /**
         * Record containing all questions (keys) that exist in this category, each valued by the
         * unique Id of the question in the database to enable deep links.
         */
        questions: z.record(z.string(), z.string()),
    })),

    /**
     * Information about the event's program.
     */
    program: z.strictObject({
        /**
         * Areas that exist within the festival's location. Record keyed by the area's ID as a
         * string, followed by an object describing its metadata.
         */
        areas: z.record(z.string(), z.strictObject({
            /**
             * Unique ID of the area.
             */
            id: z.string(),

            /**
             * Name of the area, as it should be presented to users.
             */
            name: z.string(),

            /**
             * Locations that are located in this area.
             */
            locations: z.array(z.string()),

            /**
             * Number of active events (& shifts) that are taking place in this area.
             */
            active: z.number(),
        })),

        /**
         * Locations that exist within the festival's location. Record keyed by the location's ID as
         * a string, followed by an object describing its metadata.
         */
        locations: z.record(z.string(), z.strictObject({
            /**
             * Unique ID of the location.
             */
            id: z.string(),

            /**
             * Name of the location, as it should be presented to users.
             */
            name: z.string(),

            /**
             * Unique ID of the area within which this location is located.
             */
            area: z.string(),

            /**
             * Number of active events (& shifts) that are taking place in this location.
             */
            active: z.number(),
        })),

        // TODO: activities
        // TODO: shifts
        // TODO: timeslots
    }),

    // TODO: nardo
    // TODO: volunteers
});

/**
 * Type definition of the public schedule information.
 */
export type PublicSchedule = z.infer<typeof kPublicSchedule>;

/**
 * Interface definition for the public Schedule API, exposed through /api/event/schedule.
 */
export const kPublicScheduleDefinition = z.object({
    request: z.object({
        /**
         * Unique slug of the event for which the schedule should be requested.
         */
        event: z.string(),

        /**
         * Optional number expressing, in seconds, the offset to apply to the server's time.
         */
        offset: z.coerce.number().optional(),
    }),
    response: kPublicSchedule,
});

export type PublicScheduleDefinition = ApiDefinition<typeof kPublicScheduleDefinition>;

type Request = ApiRequest<typeof kPublicScheduleDefinition>;
type Response = ApiResponse<typeof kPublicScheduleDefinition>;

/**
 * API through which volunteers can request the latest schedule of one of the AnimeCon events. This
 * is a comprehensive API that returns all necessary information, with as much computing as possible
 * offloaded to the server.
 */
export async function getSchedule(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        notFound();

    const event = await getEventBySlug(request.event);
    if (!event || !event.festivalId)
        notFound();

    const settings = await readSettings([
        'schedule-del-a-rie-advies',
        'schedule-knowledge-base',
        'schedule-search-candidate-fuzziness',
        'schedule-search-candidate-minimum-score',
        'schedule-search-result-limit',
    ]);

    const schedule: Response = {
        slug: event.slug,
        config: {
            enableKnowledgeBase: settings['schedule-knowledge-base'] ?? false,
            searchResultFuzziness: settings['schedule-search-candidate-fuzziness'] ?? 0.04,
            searchResultLimit: settings['schedule-search-result-limit'] ?? 5,
            searchResultMinimumScore: settings['schedule-search-candidate-minimum-score'] ?? 0.37,
        },
        knowledge: [ /* empty */ ],
        program: {
            areas: { /* empty */ },
            locations: { /* empty */ },
        },
    };

    //const currentServerTime = Temporal.Now.zonedDateTimeISO('UTC');
    const currentServerTime = Temporal.ZonedDateTime.from('2024-06-08T14:00:00Z[UTC]');
    const currentTime = !!request.offset ? currentServerTime.add({ seconds: request.offset })
                                         : currentServerTime;

    // ---------------------------------------------------------------------------------------------
    // Source information about the event's knowledge base.
    // ---------------------------------------------------------------------------------------------

    const dbInstance = db;
    if (schedule.config.enableKnowledgeBase) {
        const knowledge = await dbInstance.selectFrom(tContentCategories)
            .innerJoin(tContent)
                .on(tContent.contentCategoryId.equals(tContentCategories.categoryId))
                    .and(tContent.revisionVisible.equals(/* true= */ 1))
            .where(tContentCategories.eventId.equals(event.id))
                .and(tContentCategories.categoryDeleted.isNull())
            .select({
                id: tContentCategories.categoryId,
                icon: tContentCategories.categoryIcon,
                title: tContentCategories.categoryTitle,
                description: tContentCategories.categoryDescription,
                questions: dbInstance.aggregateAsArray({
                    id: tContent.contentPath,
                    question: tContent.contentTitle,
                }),
            })
            .executeSelectMany();

        schedule.knowledge = knowledge.map(category => ({
            ...category,
            questions: Object.fromEntries(
                category.questions.map(({ id, question }) => [ question, id ])),
        }));
    }

    // ---------------------------------------------------------------------------------------------
    // Source information about the event's program.
    // ---------------------------------------------------------------------------------------------

    const activities = await dbInstance.selectFrom(tActivities)
        .innerJoin(tActivitiesTimeslots)
            .on(tActivitiesTimeslots.activityId.equals(tActivities.activityId))
                .and(tActivitiesTimeslots.timeslotDeleted.isNull())
        .innerJoin(tActivitiesLocations)
            .on(tActivitiesLocations.locationId.equals(tActivitiesTimeslots.timeslotLocationId))
                .and(tActivitiesLocations.locationDeleted.isNull())
        .innerJoin(tActivitiesAreas)
            .on(tActivitiesAreas.areaId.equals(tActivitiesLocations.locationAreaId))
                .and(tActivitiesAreas.areaDeleted.isNull())
        .where(tActivities.activityFestivalId.equals(event.festivalId))
            .and(tActivities.activityType.equals(ActivityType.Program))
            .and(tActivities.activityDeleted.isNull())
        .select({
            id: tActivities.activityId,
            title: tActivities.activityTitle,
            visible: tActivities.activityVisible.equals(/* true= */ 1),

            timeslots: dbInstance.aggregateAsArray({
                id: tActivitiesTimeslots.timeslotId,
                start: tActivitiesTimeslots.timeslotStartTime,
                end: tActivitiesTimeslots.timeslotEndTime,

                area: {
                    id: tActivitiesAreas.areaId,
                    name: tActivitiesAreas.areaDisplayName.valueWhenNull(tActivitiesAreas.areaName),
                },

                location: {
                    id: tActivitiesLocations.locationId,
                    name: tActivitiesLocations.locationDisplayName.valueWhenNull(
                        tActivitiesLocations.locationName),
                },
            }),
        })
        .groupBy(tActivities.activityId)
        .executeSelectMany();

    for (const activity of activities) {
        for (const timeslot of activity.timeslots) {
            const areaId = `${timeslot.area.id}`;
            const locationId = `${timeslot.location.id}`;

            if (!Object.hasOwn(schedule.program.areas, areaId)) {
                schedule.program.areas[areaId] = {
                    id: areaId,
                    name: timeslot.area.name,
                    locations: [ /* empty */ ],
                    active: 0,
                };
            }

            if (!Object.hasOwn(schedule.program.locations, locationId)) {
                schedule.program.locations[locationId] = {
                    id: locationId,
                    name: timeslot.location.name,
                    area: areaId,
                    active: 0,
                };
            }

            schedule.program.areas[areaId].locations.push(locationId);

            // TODO: Do something with the `activity`?
            // TODO: Do something with the `timeslot`

            if (isBefore(timeslot.start, currentTime) && isAfter(timeslot.end, currentTime)) {
                schedule.program.areas[areaId].active++;
                schedule.program.locations[locationId].active++;
            }
        }
    }

    // Deduplicate the locations that are located within a given area.
    for (const [ areaId, area ] of Object.entries(schedule.program.areas))
        schedule.program.areas[areaId].locations = [ ...new Set(area.locations) ];

    // ---------------------------------------------------------------------------------------------

    return schedule;
}
