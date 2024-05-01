// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';
import { notFound } from 'next/navigation';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { ActivityType, VendorTeam } from '@lib/database/Types';
import { Privilege, can } from '@lib/auth/Privileges';
import { Temporal, isAfter, isBefore } from '@lib/Temporal';
import { getEventBySlug } from '@lib/EventLoader';
import { readSettings } from '@lib/Settings';

import db, { tActivities, tActivitiesAreas, tActivitiesLocations, tActivitiesTimeslots, tContent,
    tContentCategories, tDisplaysRequests, tNardo, tVendors, tVendorsSchedule} from '@lib/database';

/**
 * Represents the information shared for a particular vendor team. The actual information regarding
 * on-site personnel will usually be shared freely, whereas the full schedule is more restricted.
 */
const kVendorTeam = z.object({
    /**
     * Names of the active personnel who are on shift.
     */
    active: z.array(z.string()),

    /**
     * Full schedule assigned to the vendor team. Only shared with leadership.
     */
    schedule: z.array(z.object({
        /**
         * Unique ID of the vendor.
         */
        id: z.number(),

        /**
         * Name of the vendor, as it should be shown in the calendar.
         */
        name: z.string(),

        /**
         * Shifts assigned to this vendor, if any.
         */
        shifts: z.array(z.object({
            /**
             * Date and time on which the shift will start, as a UNIX timestamp since the epoch.
             */
            start: z.number(),

            /**
             * Date and time on which the shift will start, as a UNIX timestamp since the epoch.
             */
            end: z.number(),
        })),

    })),
});

/**
 * Type definition of the public schedule information for a particular vendor team.
 */
export type PublicVendorSchedule = z.infer<typeof kVendorTeam>['schedule'];

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
         * Number of active and pending activities to list for an area or location.
         */
        activityListLimit: z.number(),

        /**
         * Whether access to help requests should be enabled.
         */
        enableHelpRequests: z.boolean().optional(),

        /**
         * Whether the knowledge base should be enabled.
         */
        enableKnowledgeBase: z.boolean(),

        /**
         * Whether searching through the knowledge base should be enabled.
         */
        enableKnowledgeBaseSearch: z.boolean(),

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

        /**
         * Time offset, in seconds, to alter the local timestamp by. Used to emulate the schedule at
         * another point in time for testing purposes.
         */
        timeOffset: z.number().optional(),

        /**
         * Timezone in which dates and times should be represented.
         */
        timezone: z.string(),
    }),

    /**
     * Number of help requests that are still pending activity from a senior volunteer.
     */
    helpRequestsPending: z.number().optional(),

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
         * Activities part of the program. Record keyed by the activity's ID as a string, followed
         * by an object describing its metadata.
         */
        activities: z.record(z.string(), z.strictObject({
            /**
             * Unique ID of the activity.
             */
            id: z.string(),

            /**
             * Title, as the activity should be presented to users.
             */
            title: z.string(),

            /**
             * Timeslots that exist for this activity.
             */
            timeslots: z.array(z.string()),

            /**
             * Set when the timeslot is invisible to the public.
             */
            invisible: z.literal(true).optional(),

            // TODO: description
        })),

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
             * Timeslots that will be taking place in this location.
             */
            timeslots: z.array(z.string()),

            /**
             * Number of active events (& shifts) that are taking place in this location.
             */
            active: z.number(),
        })),

        /**
         * Timeslots that will happen during the festival. Each timeslot is associated with an
         * activity that's part of the program.
         */
        timeslots: z.record(z.string(), z.strictObject({
            /**
             * Unique ID of the timeslot.
             */
            id: z.string(),

            /**
             * Unique ID of the activity this timeslot belongs to.
             */
            activity: z.string(),

            /**
             * Unique ID of the location this timeslot will be hosted in.
             */
            location: z.string(),

            /**
             * Date and time on which the slot will start, as a UNIX timestamp since the epoch.
             */
            start: z.number(),

            /**
             * Date and time on which the slot will end, as a UNIX timestamp since the epoch.
             */
            end: z.number(),

            /**
             * Whether the timeslot is currently active, and should be presented as such.
             */
            active: z.literal(true).optional(),
        })),
    }),

    /**
     * The excellent piece of Del a Rie advice that should be shown on the overview page.
     */
    nardo: z.string().optional(),

    // TODO: shifts

    /**
     * Information about the vendors that will be helping out during the event. Regular volunteers
     * will be presented with an informational card, where volunteering leads will be able to see
     * their full availability in a calendar-style display.
     */
    vendors: z.record(z.nativeEnum(VendorTeam), kVendorTeam),

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
    if (!props.user || !props.authenticationContext.user)
        notFound();

    const event = await getEventBySlug(request.event);
    if (!event || !event.festivalId)
        notFound();

    let isLeader: boolean = can(props.user, Privilege.EventAdministrator);
    if (!isLeader) {
        const eventAuthenticationContext = props.authenticationContext.events.get(event.slug);
        if (!eventAuthenticationContext && !can(props.user, Privilege.EventScheduleOverride))
            notFound();

        isLeader = !!eventAuthenticationContext?.admin;
    }

    const settings = await readSettings([
        'schedule-activity-list-limit',
        'schedule-del-a-rie-advies',
        'schedule-del-a-rie-advies-time-limit',
        'schedule-knowledge-base',
        'schedule-knowledge-base-search',
        'schedule-search-candidate-fuzziness',
        'schedule-search-candidate-minimum-score',
        'schedule-search-result-limit',
        'schedule-time-offset-seconds',
        'schedule-vendor-first-aid-card',
        'schedule-vendor-security-card',
    ]);

    const schedule: Response = {
        slug: event.slug,
        config: {
            activityListLimit: settings['schedule-activity-list-limit'] ?? 5,
            enableHelpRequests: can(props.user, Privilege.EventHelpRequests),
            enableKnowledgeBase: settings['schedule-knowledge-base'] ?? false,
            enableKnowledgeBaseSearch: settings['schedule-knowledge-base-search'] ?? false,
            searchResultFuzziness: settings['schedule-search-candidate-fuzziness'] ?? 0.04,
            searchResultLimit: settings['schedule-search-result-limit'] ?? 5,
            searchResultMinimumScore: settings['schedule-search-candidate-minimum-score'] ?? 0.37,
            timeOffset: settings['schedule-time-offset-seconds'] || undefined,
            timezone: event.timezone,
        },
        knowledge: [ /* empty */ ],
        program: {
            activities: { /* empty */ },
            areas: { /* empty */ },
            locations: { /* empty */ },
            timeslots: { /* empty */ },
        },
        vendors: { /* empty */ },
    };

    const currentServerTime = Temporal.Now.zonedDateTimeISO('UTC');
    const currentTime = !!schedule.config.timeOffset
        ? currentServerTime.add({ seconds: schedule.config.timeOffset })
        : currentServerTime;

    // ---------------------------------------------------------------------------------------------
    // Source information about any pending help requests.
    // ---------------------------------------------------------------------------------------------

    const dbInstance = db;
    if (schedule.config.enableHelpRequests) {
        schedule.helpRequestsPending = await dbInstance.selectFrom(tDisplaysRequests)
            .where(tDisplaysRequests.requestEventId.equals(event.id))
                .and(tDisplaysRequests.requestAcknowledgedBy.isNull())
            .selectCountAll()
            .executeSelectNoneOrOne() ?? undefined;
    }

    // ---------------------------------------------------------------------------------------------
    // Source information about the event's knowledge base.
    // ---------------------------------------------------------------------------------------------

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
            .groupBy(tContentCategories.categoryId)
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
        const activityId = `${activity.id}`;

        schedule.program.activities[activityId] = {
            id: activityId,
            title: activity.title,
            timeslots: [ /* empty */ ],
        };

        if (!activity.visible)
            schedule.program.activities[activityId].invisible = true;

        for (const timeslot of activity.timeslots) {
            const areaId = `${timeslot.area.id}`;
            const locationId = `${timeslot.location.id}`;
            const timeslotId = `${timeslot.id}`;

            if (!Object.hasOwn(schedule.program.areas, areaId)) {
                schedule.program.areas[areaId] = {
                    id: areaId,
                    name: timeslot.area.name,
                    locations: [ /* empty */ ],
                    active: 0,
                };
            }

            if (!Object.hasOwn(schedule.program.locations, locationId)) {
                schedule.program.areas[areaId].locations.push(locationId);
                schedule.program.locations[locationId] = {
                    id: locationId,
                    name: timeslot.location.name,
                    area: areaId,
                    timeslots: [ /* empty */ ],
                    active: 0,
                };
            }

            schedule.program.activities[activityId].timeslots.push(timeslotId);
            schedule.program.locations[locationId].timeslots.push(timeslotId);

            schedule.program.timeslots[timeslotId] = {
                id: timeslotId,
                activity: activityId,
                location: locationId,
                start: timeslot.start.epochSeconds,
                end: timeslot.end.epochSeconds,
            };

            if (isBefore(timeslot.start, currentTime) && isAfter(timeslot.end, currentTime)) {
                schedule.program.areas[areaId].active++;
                schedule.program.locations[locationId].active++;
                schedule.program.timeslots[timeslotId].active = true;
            }
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Source information about the event's volunteers and shifts.
    // ---------------------------------------------------------------------------------------------

    // TODO

    // ---------------------------------------------------------------------------------------------
    // Source information about the event's vendors.
    // ---------------------------------------------------------------------------------------------

    const vendorCardFirstAid = !!settings['schedule-vendor-first-aid-card'];
    const vendorCardSecurity = !!settings['schedule-vendor-security-card'];

    if (isLeader || vendorCardFirstAid || vendorCardSecurity) {
        if (isLeader || vendorCardFirstAid)
            schedule.vendors[VendorTeam.FirstAid] = { active: [ /* empty */ ], schedule: [] };
        if (isLeader || vendorCardSecurity)
            schedule.vendors[VendorTeam.Security] = { active: [ /* empty */ ], schedule: [] };

        const vendorsScheduleJoin = tVendorsSchedule.forUseInLeftJoin();
        const vendors = await dbInstance.selectFrom(tVendors)
            .leftJoin(vendorsScheduleJoin)
                .on(vendorsScheduleJoin.vendorId.equals(tVendors.vendorId))
                    .and(vendorsScheduleJoin.vendorsScheduleDeleted.isNull())
            .where(tVendors.eventId.equals(event.id))
                .and(tVendors.vendorVisible.equals(/* true= */ 1))
            .select({
                id: tVendors.vendorId,
                firstName: tVendors.vendorFirstName,
                lastName: tVendors.vendorLastName,
                team: tVendors.vendorTeam,
                shifts: dbInstance.aggregateAsArray({
                    start: vendorsScheduleJoin.vendorsScheduleStart,
                    end: vendorsScheduleJoin.vendorsScheduleEnd,
                }),
            })
            .groupBy(tVendors.vendorId)
            .orderBy(tVendors.vendorFirstName, 'asc')
                .orderBy(tVendors.vendorLastName, 'asc')
            .executeSelectMany();

        for (const vendor of vendors) {
            if (isLeader) {
                schedule.vendors[vendor.team]!.schedule.push({
                    id: vendor.id,
                    name: `${vendor.firstName} ${vendor.lastName}`.trim(),
                    shifts: vendor.shifts.map(shift => ({
                        start: shift.start.epochSeconds,
                        end: shift.end.epochSeconds,
                    })),
                });
            } else {
                if (vendor.team === VendorTeam.FirstAid && !vendorCardFirstAid)
                    continue;
                if (vendor.team === VendorTeam.Security && !vendorCardSecurity)
                    continue;
            }

            for (const shift of vendor.shifts) {
                if (isBefore(shift.start, currentTime) && isAfter(shift.end, currentTime)) {
                    schedule.vendors[vendor.team]!.active.push(vendor.firstName);
                    break;
                }
            }
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Source information about the latest and greatest Del a Rie advice
    // ---------------------------------------------------------------------------------------------

    if (!!settings['schedule-del-a-rie-advies']) {
        const timeLimitMinutes = settings['schedule-del-a-rie-advies-time-limit'] ?? 5;
        const timeLimitSeconds = timeLimitMinutes * 60;

        const seedBase = Temporal.Now.instant().epochSeconds;
        const seed = Math.round(seedBase / timeLimitSeconds) * timeLimitSeconds;

        schedule.nardo = await db.selectFrom(tNardo)
            .where(tNardo.nardoVisible.equals(/* true= */ 1))
            .selectOneColumn(tNardo.nardoAdvice)
            .orderBy(dbInstance.rawFragment`rand(${dbInstance.const(seed, 'int')})`)
            .limit(1)
            .executeSelectNoneOrOne() ?? undefined;
    }

    // ---------------------------------------------------------------------------------------------

    return schedule;
}
