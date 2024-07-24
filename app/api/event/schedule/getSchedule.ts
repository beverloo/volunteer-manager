// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';
import { notFound } from 'next/navigation';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import type { DBConnection } from '@lib/database/Connection';
import { ActivityType, RegistrationStatus, VendorTeam } from '@lib/database/Types';
import { Temporal, isAfter, isBefore } from '@lib/Temporal';
import { getBlobUrl } from '@lib/database/BlobStore';
import { getEventBySlug } from '@lib/EventLoader';
import { readSettings } from '@lib/Settings';
import db, { tActivities, tActivitiesAreas, tActivitiesLocations, tActivitiesTimeslots, tContent,
    tContentCategories, tDisplaysRequests, tNardo, tRoles, tSchedule, tShifts, tStorage, tTeams,
    tUsers, tUsersEvents, tVendors, tVendorsSchedule } from '@lib/database';

import { kAnyTeam } from '@lib/auth/AccessList';
import { kAvailabilityException } from '@app/api/admin/event/schedule/fn/determineAvailability';
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
 * Number of hours after the event's closing that we can reasonably expect volunteers to stay around
 * for. This is a window in which the information may not be accurate.
 */
const kAvailabilityAfterOpeningHours = 0;

/**
 * Number of hours prior to the event's opening that we can reasonably expect the first volunteers
 * to arrive on site. This is a window in which the information may not be accurate.
 */
const kAvailabilityBeforeOpeningHours = 2;

/**
 * Offset for activity IDs that are dynamically generated by the program population logic.
 */
const kInternalActivityOffset = 15_000_000;

/**
 * Offset for timeslot IDs that are dynamically generated by the program population logic.
 */
const kInternalTimeslotOffset = 20_000_000;

/**
 * Information necessary to determine a volunteer's unavailability not specifically to them.
 */
interface UnavailabilityEventInfo {
    currentTime: Temporal.ZonedDateTime;
    currentZonedTime: Temporal.ZonedDateTime;
    eventAvailabilityStartTime: Temporal.ZonedDateTime;
    eventAvailabilityEndTime: Temporal.ZonedDateTime;
}

/**
 * Information necessary to determine a volunteer's unavailability specifically to them.
 */
interface UnavailabilityVolunteerInfo {
    availabilityExceptions?: string;
    preferenceTimingStart?: number;
    preferenceTimingEnd?: number;
}

/**
 * Function signature that can help determine the availability of a volunteer.
 */
type UnavailabilityFn = (volunteer: UnavailabilityVolunteerInfo) => number | undefined;

/**
 * Determines the availability of a volunteer with the given information. Returns either `undefined`
 * when they are presently available, a UNIX timestamp when they are temporarily unavailable, or
 * the literal "-1" when they are permanently unavailable.
 */
function determineVolunteerUnavailability(
    event: UnavailabilityEventInfo, volunteer: UnavailabilityVolunteerInfo): number | undefined
{
    // TODO: This method could be a lot more sophisticated and return a UNIX timestamp indicating
    // when the `volunteer` is next available. However, implementing this logic is not something
    // that we prioritise for the upcoming event, and can reconsider for a future iteration.

    if (Temporal.ZonedDateTime.compare(event.eventAvailabilityEndTime, event.currentTime) <= 0)
        return -1;  // the event has finished

    if (!!volunteer.availabilityExceptions) {
        try {
            const availabilityExceptionsString = JSON.parse(volunteer.availabilityExceptions);
            const availabilityExceptions =
                z.array(kAvailabilityException).parse(availabilityExceptionsString);

            for (const exception of availabilityExceptions) {
                if (Temporal.ZonedDateTime.compare(exception.start, event.currentTime) > 0)
                    continue;  // the |exception| happens in the future
                if (Temporal.ZonedDateTime.compare(exception.end, event.currentTime) <= 0)
                    continue;  // the |exception| happened in the past

                switch (exception.state) {
                    case 'available':
                        return undefined;  // they are explicitly marked as available
                    case 'unavailable':
                        return -1;  // they are explicitly marked as unavailable
                }
            }
        } catch (error: any) { /* ignore */ }
    }

    if (Temporal.ZonedDateTime.compare(event.eventAvailabilityStartTime, event.currentTime) > 0)
        return -1;  // the event has not started yet

    const { preferenceTimingStart, preferenceTimingEnd } = volunteer;
    if (preferenceTimingStart !== undefined && preferenceTimingEnd !== undefined) {
        const currentHour = event.currentZonedTime.hour;

        if (preferenceTimingEnd > preferenceTimingStart) {
            if (currentHour < preferenceTimingStart || currentHour >= preferenceTimingEnd)
                return -1;

        } else {
            if (currentHour < preferenceTimingStart && currentHour >= preferenceTimingEnd)
                return -1;
        }
    }

    return undefined;
}

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
            schedule: [ /* empty */ ],
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

/**
 * Populates the volunteers who participate in this event in the given `schedule`. All information
 * relevant for the given `eventId` will be fetched. When `isLeader` is set, all teams will be
 * returned, otherwise `team` will be used to limit the scope of the returned information.
 */
async function populateVolunteers(
    dbInstance: DBConnection, schedule: Response, currentTime: Temporal.ZonedDateTime,
    eventId: number, unavailabilityFn: UnavailabilityFn, isLeader: boolean, team?: string)
{
    const storageJoin = tStorage.forUseInLeftJoin();

    const volunteers = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .leftJoin(storageJoin)
            .on(storageJoin.fileId.equals(tUsers.avatarId))
        .where(tUsersEvents.eventId.equals(eventId))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
            .and(tTeams.teamSlug.equalsIfValue(team).ignoreWhen(isLeader))
        .select({
            id: tUsers.userId,
            user: {
                name: tUsers.name,

                avatar: storageJoin.fileHash,
                notes: tUsersEvents.registrationNotes,
                phoneNumber: tUsers.phoneNumber,

                availabilityExceptions: tUsersEvents.availabilityExceptions,
                preferenceTimingStart: tUsersEvents.preferenceTimingStart,
                preferenceTimingEnd: tUsersEvents.preferenceTimingEnd,

                role: {
                    name: tRoles.roleName,
                    badge: tRoles.roleBadge,
                    isLeader: tRoles.roleAdminAccess.equals(/* true= */ 1),
                },
                team: {
                    id: tTeams.teamId,
                    name: tTeams.teamName,
                    colour: tTeams.teamColourLightTheme,
                },
            },
        })
        .groupBy(tUsersEvents.userId)
        .orderBy('user.name', 'asc')
        .executeSelectMany();

    for (const volunteer of volunteers) {
        const volunteerId = `${volunteer.id}`;
        const teamId = `${volunteer.user.team.id}`;

        if (!Object.hasOwn(schedule.teams, teamId)) {
            schedule.teams[teamId] = {
                id: teamId,
                name: volunteer.user.team.name,
                colour: volunteer.user.team.colour,
            };
        }

        // Phone numbers are included and available in the app when the signed in user is a leader,
        // or when the displayed volunteer is a leader. Their phone number will be shared with the
        // other volunteers via the WhatsApp group anyway.
        const includePhoneNumber = isLeader || volunteer.user.role.isLeader;

        schedule.volunteers[volunteerId] = {
            id: volunteerId,
            avatar: getBlobUrl(volunteer.user.avatar),
            name: volunteer.user.name,
            role: volunteer.user.role.name,
            roleBadge: volunteer.user.role.badge,
            roleLeader: !!volunteer.user.role.isLeader ? true : undefined,
            team: `${volunteer.user.team.id}`,
            notes: isLeader ? volunteer.user.notes : undefined,
            phoneNumber: includePhoneNumber ? volunteer.user.phoneNumber : undefined,
            schedule: [ /* empty */ ],
            unavailableUntil: unavailabilityFn(volunteer.user),
        };
    }

    const activitiesJoin = tActivities.forUseInLeftJoinAs('aj');
    const activitiesAreasJoin = tActivitiesAreas.forUseInLeftJoinAs('aaj');
    const activitiesLocationsJoin = tActivitiesLocations.forUseInLeftJoinAs('alj');

    const shiftAreaJoin = tActivitiesAreas.forUseInLeftJoinAs('saj');
    const shiftLocationJoin = tActivitiesLocations.forUseInLeftJoinAs('slj');

    const scheduleJoin = tSchedule.forUseInLeftJoin();

    const shifts = await dbInstance.selectFrom(tShifts)
        .leftJoin(activitiesJoin)
            .on(activitiesJoin.activityId.equals(tShifts.shiftActivityId))
        .leftJoin(activitiesLocationsJoin)
            .on(activitiesLocationsJoin.locationId.equals(activitiesJoin.activityLocationId))
        .leftJoin(activitiesAreasJoin)
            .on(activitiesAreasJoin.areaId.equals(activitiesLocationsJoin.locationAreaId))
        .leftJoin(shiftLocationJoin)
            .on(shiftLocationJoin.locationId.equals(tShifts.shiftLocationId))
        .leftJoin(shiftAreaJoin)
            .on(shiftAreaJoin.areaId.equals(shiftLocationJoin.locationAreaId))
        .leftJoin(scheduleJoin)
            .on(scheduleJoin.shiftId.equals(tShifts.shiftId))
                .and(scheduleJoin.eventId.equals(eventId))
                .and(scheduleJoin.scheduleDeleted.isNull())
        .where(tShifts.eventId.equals(eventId))
            .and(tShifts.shiftDeleted.isNull())
        .select({
            id: tShifts.shiftId,
            team: tShifts.teamId,
            name: tShifts.shiftName,
            description: tShifts.shiftDescription,
            location: {
                id: shiftLocationJoin.locationId,
                name: shiftLocationJoin.locationDisplayName.valueWhenNull(
                    shiftLocationJoin.locationName),

                area: {
                    id: shiftAreaJoin.areaId,
                    name: shiftAreaJoin.areaDisplayName.valueWhenNull(shiftAreaJoin.areaName),
                },
            },
            activity: {
                id: tShifts.shiftActivityId,
                location: {
                    id: activitiesLocationsJoin.locationId,
                    name: activitiesLocationsJoin.locationDisplayName.valueWhenNull(
                        activitiesLocationsJoin.locationName),

                    area: {
                        id: activitiesAreasJoin.areaId,
                        name: activitiesAreasJoin.areaDisplayName.valueWhenNull(
                            activitiesAreasJoin.areaName),
                    },
                },
            },
            schedule: dbInstance.aggregateAsArray({
                id: scheduleJoin.scheduleId,
                userId: scheduleJoin.userId,
                start: scheduleJoin.scheduleTimeStart,
                end: scheduleJoin.scheduleTimeEnd,
            }),
        })
        .groupBy(tShifts.shiftId)
        .executeSelectMany();

    for (const shift of shifts) {
        const shiftId = `${shift.id}`;

        // Bail out when the shift doesn't have any scheduled instances. There is no point in
        // creating the associated metainformation as it won't be presented anywhere.
        if (!shift.schedule.length)
            continue;

        // Generate a deterministic activity ID for shifts that we create out of our own initiative.
        if (!shift.activity || !shift.activity.id) {
            shift.activity = {
                id: kInternalActivityOffset + shift.id,
                location: shift.location,
            };
        }

        const activityId = `${shift.activity.id}`;

        if (!Object.hasOwn(schedule.program.activities, activityId)) {
            // (1) Internal activities must have a location. However, the tool does not allow us to
            // guarantee that one has been set, so have an automatic mitigation in case that failed.
            if (!shift.activity.location) {
                console.error(`Shift with an internal activity, but no location: ${shiftId}`);

                // Try to mitigate the lack of a location by picking the first one defined in the
                // program. This'll wrongly parent the shift, but it'll still be accessible.
                const existingLocations = Object.keys(schedule.program.locations);
                if (!existingLocations.length)
                    continue;  // no locations exist either

                const existingLocation = schedule.program.locations[existingLocations[0]];
                const existingArea = schedule.program.areas[existingLocation.area];

                shift.activity.location = {
                    id: parseInt(existingLocation.id, /* radix= */ 10),
                    name: existingLocation.name,
                    area: {
                        id: parseInt(existingArea.id, /* radix= */ 10),
                        name: existingArea.name,
                    },
                };
            }

            const locationId = `${shift.activity.location.id}`;

            // (2) Internal locations are not included in the program by default, unless a shift
            // exists that requires them. The location may have to be appended.
            if (!Object.hasOwn(schedule.program.locations, locationId)) {
                // (2b) Internal locations are always associated with an area. This may fail when a
                // manual data manipulation has been done, so implement a similar mitigation.
                if (!shift.activity.location.area) {
                    console.error(`Shift with an internal location, but no area: ${shiftId}`);

                    const existingAreas = Object.keys(schedule.program.areas);
                    if (!existingAreas.length)
                        continue;  // no areas exist

                    const existingArea = schedule.program.areas[existingAreas[0]];

                    shift.activity.location.area = {
                        id: parseInt(existingArea.id, /* radix= */ 10),
                        name: existingArea.name,
                    };
                }

                const areaId = `${shift.activity.location.area.id}`;

                // (2c) Internal areas are not included in the program by default either, so create
                // the area when this has been created exclusively for a shift.
                if (!Object.hasOwn(schedule.program.areas, areaId)) {
                    schedule.program.areas[areaId] = {
                        id: areaId,
                        name: shift.activity.location.area.name,
                        locations: [ /* empty */ ],
                        active: 0,
                    };
                }

                schedule.program.areas[areaId].locations.push(locationId);
                schedule.program.locations[locationId] = {
                    id: locationId,
                    name: shift.activity.location.name,
                    area: areaId,
                    timeslots: [ /* empty */ ],
                    active: 0,
                };
            }

            // (3) Create an activity for this shift. Timeslots and the schedule will be created and
            // associated with this entry in the following steps.
            schedule.program.activities[activityId] = {
                id: activityId,
                title: shift.name,
                timeslots: [ /* empty */ ],
                timeslotsHidden: true,
                invisible: true,
                schedule: [ /* empty */ ],
            };

            // (4) Compose timeslots for the created activity based on the scheduled shifts.
            {
                const sortedSchedule = shift.schedule.map(entry => ({ ...entry }));
                sortedSchedule.sort((lhs, rhs) => {
                    const startCompare = Temporal.ZonedDateTime.compare(lhs.start, rhs.start);
                    return !!startCompare ? startCompare
                                          : Temporal.ZonedDateTime.compare(lhs.end, rhs.end);
                });

                let timeslot = sortedSchedule.shift();
                let timeslotId = kInternalTimeslotOffset + shift.activity.id! * 10_000;

                do {
                    if (!timeslot)
                        break;  // defensive, this should only happen when len(`sortedSchedule`)=0

                    while (sortedSchedule.length > 0) {
                        const peek = sortedSchedule[0];
                        if (Temporal.ZonedDateTime.compare(timeslot.end, peek.start) < 0)
                            break;  // |peek| timeslot starts after |timeslot| has already ended

                        const nextTimeslot = sortedSchedule.shift()!;
                        if (Temporal.ZonedDateTime.compare(timeslot.end, nextTimeslot.end) >= 0)
                            continue;  // |nextTimeslot| ends before the |timeslot| ends

                        timeslot.end = nextTimeslot.end;
                    }

                    const timeslotIdString = `${timeslotId++}`;

                    schedule.program.activities[activityId].timeslots.push(timeslotIdString);
                    schedule.program.locations[locationId].timeslots.push(timeslotIdString);
                    schedule.program.timeslots[timeslotIdString] = {
                        id: timeslotIdString,
                        activity: activityId,
                        location: locationId,
                        start: timeslot.start.epochSeconds,
                        end: timeslot.end.epochSeconds,
                    };

                    if (isBefore(timeslot.start, currentTime)
                            && isAfter(timeslot.end, currentTime))
                    {
                        const areaId = schedule.program.locations[locationId].area;

                        schedule.program.areas[areaId].active++;
                        schedule.program.locations[locationId].active++;
                        schedule.program.timeslots[timeslotIdString].active = true;
                    }

                    timeslot = sortedSchedule.shift();

                } while (!!timeslot);
            }
        }

        for (const scheduledShift of shift.schedule) {
            const volunteerId = `${scheduledShift.userId}`;

            if (!Object.hasOwn(schedule.volunteers, volunteerId))
                continue;  // the |shift| will be performed by someone unknown to the volunteer

            const scheduledId = `${scheduledShift.id}`;
            schedule.schedule[scheduledId] = {
                id: scheduledId,
                volunteer: volunteerId,
                shift: shiftId,
                start: scheduledShift.start.epochSeconds,
                end: scheduledShift.end.epochSeconds,
            };

            if (isBefore(scheduledShift.start, currentTime)
                    && isAfter(scheduledShift.end, currentTime))
            {
                if (!schedule.volunteers[volunteerId].activeShift)
                    schedule.volunteersActive++;

                schedule.volunteers[volunteerId].activeShift = shiftId;
            }

            schedule.program.activities[activityId].schedule.push(scheduledId);
            schedule.volunteers[volunteerId].schedule.push(scheduledId);
        }

        schedule.shifts[shiftId] = {
            id: shiftId,
            activity: activityId,
            team: `${shift.team}`,
            name: shift.name,
            description: shift.description,
        };
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

    const { access } = props;

    let isLeader: boolean = false;
    let team: string | undefined;

    {
        const eventAuthenticationContext = props.authenticationContext.events.get(event.slug);
        if (!!eventAuthenticationContext) {
            isLeader = !!eventAuthenticationContext?.admin;
            team = eventAuthenticationContext?.team;
        }

        isLeader ||= access.can('event.schedules', 'read', { event: event.slug, team: kAnyTeam });
        if (!eventAuthenticationContext && !isLeader)
            notFound();
    }

    // ---------------------------------------------------------------------------------------------

    const settings = await readSettings([
        'schedule-activity-list-limit',
        'schedule-check-in-rate-seconds',
        'schedule-del-a-rie-advies',
        'schedule-del-a-rie-advies-time-limit',
        'schedule-knowledge-base',
        'schedule-knowledge-base-search',
        'schedule-logical-days',
        'schedule-search-candidate-fuzziness',
        'schedule-search-candidate-minimum-score',
        'schedule-search-result-limit',
        'schedule-sort-past-days-last',
        'schedule-sort-past-events-last',
        'schedule-time-offset-seconds',
        'schedule-vendor-first-aid-card',
        'schedule-vendor-security-card',
    ]);

    const schedule: Response = {
        event: event.shortName,
        slug: event.slug,
        config: {
            activityListLimit: settings['schedule-activity-list-limit'] ?? 5,
            enableAvatarManagement: access.can('volunteer.avatars'),
            enableHelpRequests: access.can('event.help-requests', { event: event.slug }),
            enableKnowledgeBase: settings['schedule-knowledge-base'] ?? false,
            enableKnowledgeBaseSearch: settings['schedule-knowledge-base-search'] ?? false,
            enableLogicalDays: settings['schedule-logical-days'] ?? false,
            enableNotesEditor: isLeader,
            searchResultFuzziness: settings['schedule-search-candidate-fuzziness'] ?? 0.04,
            searchResultLimit: settings['schedule-search-result-limit'] ?? 5,
            searchResultMinimumScore: settings['schedule-search-candidate-minimum-score'] ?? 0.37,
            sortPastDaysLast: settings['schedule-sort-past-days-last'] ?? true,
            sortPastEventsLast: settings['schedule-sort-past-events-last'] ?? true,
            timeOffset: settings['schedule-time-offset-seconds'] || undefined,
            timezone: event.timezone,
            updateFrequencyMs: (settings['schedule-check-in-rate-seconds'] ?? (5 * 60)) * 1000,
        },
        knowledge: [ /* empty */ ],
        program: {
            activities: { /* empty */ },
            areas: { /* empty */ },
            locations: { /* empty */ },
            timeslots: { /* empty */ },
        },
        schedule: { /* empty */ },
        shifts: { /* empty */ },
        teams: { /* empty */ },
        userId: props.user.userId,
        vendors: { /* empty */ },
        volunteersActive: 0,
        volunteers: { /* empty */ },
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

    const unavailabilityFn = determineVolunteerUnavailability.bind(null, {
        currentTime,
        currentZonedTime: currentTime.withTimeZone(event.timezone),
        eventAvailabilityStartTime: event.temporalStartTime.subtract({
            hours: kAvailabilityBeforeOpeningHours
        }),
        eventAvailabilityEndTime: event.temporalEndTime.add({
            hours: kAvailabilityAfterOpeningHours
        }),
    });

    await populateVolunteers(
        dbInstance, schedule, currentTime, event.id, unavailabilityFn, isLeader, team);

    // ---------------------------------------------------------------------------------------------

    return schedule;
}
