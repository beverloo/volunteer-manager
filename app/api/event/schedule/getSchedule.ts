// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';
import { notFound } from 'next/navigation';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import type { DBConnection } from '@lib/database/Connection';
import { ActivityType, VendorTeam } from '@lib/database/Types';
import { Privilege, can } from '@lib/auth/Privileges';
import { Temporal, isAfter, isBefore } from '@lib/Temporal';
import { getEventBySlug } from '@lib/EventLoader';
import { readSettings } from '@lib/Settings';
import db, { tActivities, tActivitiesAreas, tActivitiesLocations, tActivitiesTimeslots, tContent,
    tContentCategories, tDisplaysRequests, tNardo, tVendors,
    tVendorsSchedule } from '@lib/database';

import { kPublicSchedule } from './PublicSchedule';

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

// -------------------------------------------------------------------------------------------------

/**
 * Populates the knowledge base information in the given `schedule`. The categories (including their
 * metadata) and the questions therein will be added to the schedule, whereas the answers will be
 * provided by the server when accessing the associated page.
 */
async function populateKnowledgeBase(
    dbInstance: DBConnection, schedule: Response, eventId: number)
{
    const knowledge = await dbInstance.selectFrom(tContentCategories)
        .innerJoin(tContent)
            .on(tContent.contentCategoryId.equals(tContentCategories.categoryId))
                .and(tContent.revisionVisible.equals(/* true= */ 1))
        .where(tContentCategories.eventId.equals(eventId))
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

// -------------------------------------------------------------------------------------------------

/**
 * Populates metadata in the given `schedule`. This includes arbitrary information that we can throw
 * together in a single query, even though not all of it may be enabled per function arguments.
 */
async function populateMetadata(
    dbInstance: DBConnection, schedule: Response, eventId: number, includeAdvice: boolean,
    adviceTimeLimitMinutes: number)
{
    if (!schedule.config.enableHelpRequests && !includeAdvice)
        return;  // no information is requested to be provided to the schedule...

    const helpRequestsPendingSubQuery = dbInstance.selectFrom(tDisplaysRequests)
        .where(tDisplaysRequests.requestEventId.equals(eventId))
            .and(tDisplaysRequests.requestAcknowledgedBy.isNull())
        .selectCountAll()
        .forUseAsInlineQueryValue();

    const timeLimitMinutes = adviceTimeLimitMinutes;
    const timeLimitSeconds = timeLimitMinutes * 60;

    const seedBase = Temporal.Now.instant().epochSeconds;
    const seed = Math.round(seedBase / timeLimitSeconds) * timeLimitSeconds;

    const nardoAdviceSubQuery = dbInstance.selectFrom(tNardo)
        .where(tNardo.nardoVisible.equals(/* true= */ 1))
        .selectOneColumn(tNardo.nardoAdvice)
        .orderBy(dbInstance.rawFragment`rand(${dbInstance.const(seed, 'int')})`)
        .limit(1)
        .forUseAsInlineQueryValue();

    const metadata = await db.selectFromNoTable()
        .select({
            helpRequestsPending: helpRequestsPendingSubQuery,
            nardoAdvice: nardoAdviceSubQuery,
        })
        .executeSelectNoneOrOne();

    if (schedule.config.enableHelpRequests && metadata)
        schedule.helpRequestsPending = metadata.helpRequestsPending;

    if (includeAdvice && metadata)
        schedule.nardo = metadata.nardoAdvice;
}

// -------------------------------------------------------------------------------------------------

/**
 * Populates the event's program in the given `schedule`, given the `festivalId`. All information
 * will be copied to the `schedule` as requested, with event activity information being computed
 * based on the given `currentTime`.
 */
async function populateProgram(
    dbInstance: DBConnection, schedule: Response, currentTime: Temporal.ZonedDateTime,
    festivalId: number)
{
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
        .where(tActivities.activityFestivalId.equals(festivalId))
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
}

// -------------------------------------------------------------------------------------------------

/**
 * Populates the vendor information in the given `schedule`. Not all vendors are required, however,
 * the `isLeader` boolean overrides that behaviour as a more substantial calendar will be included
 * in addition to bare information for the overview card.
 */
async function populateVendors(
    dbInstance: DBConnection, schedule: Response, currentTime: Temporal.ZonedDateTime,
    eventId: number, includeFirstAid: boolean, includeSecurity: boolean, isLeader: boolean)
{
    if (isLeader || includeFirstAid)
        schedule.vendors[VendorTeam.FirstAid] = { active: [ /* empty */ ], schedule: [] };
    if (isLeader || includeSecurity)
        schedule.vendors[VendorTeam.Security] = { active: [ /* empty */ ], schedule: [] };

    const vendorsScheduleJoin = tVendorsSchedule.forUseInLeftJoin();
    const vendors = await dbInstance.selectFrom(tVendors)
        .leftJoin(vendorsScheduleJoin)
            .on(vendorsScheduleJoin.vendorId.equals(tVendors.vendorId))
                .and(vendorsScheduleJoin.vendorsScheduleDeleted.isNull())
        .where(tVendors.eventId.equals(eventId))
            .and(tVendors.vendorVisible.equals(/* true= */ 1))
        .select({
            id: tVendors.vendorId,
            firstName: tVendors.vendorFirstName,
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
                name: vendor.firstName,
                shifts: vendor.shifts.map(shift => ({
                    start: shift.start.epochSeconds,
                    end: shift.end.epochSeconds,
                })),
            });
        } else {
            if (vendor.team === VendorTeam.FirstAid && !includeFirstAid)
                continue;
            if (vendor.team === VendorTeam.Security && !includeSecurity)
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

// -------------------------------------------------------------------------------------------------

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

    // ---------------------------------------------------------------------------------------------

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
    // Source information about information in the program. These steps are deliberately designed to
    // be relatively stateless, enabling information to be cached or joined where possible.
    // ---------------------------------------------------------------------------------------------

    const dbInstance = db;

    if (schedule.config.enableKnowledgeBase)
        await populateKnowledgeBase(dbInstance, schedule, event.id);

    await populateMetadata(
        dbInstance, schedule, event.id, !!settings['schedule-del-a-rie-advies'],
        settings['schedule-del-a-rie-advies-time-limit'] ?? 5);

    await populateProgram(dbInstance, schedule, currentTime, event.festivalId);

    const includeFirstAidVendors = !!settings['schedule-vendor-first-aid-card'];
    const includeSecurityVendors = !!settings['schedule-vendor-security-card'];

    if (isLeader || includeFirstAidVendors || includeSecurityVendors) {
        await populateVendors(
            dbInstance, schedule, currentTime, event.id, includeFirstAidVendors,
            includeSecurityVendors, isLeader);
    }

    // ---------------------------------------------------------------------------------------------

    return schedule;
}
