// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import EditNoteIcon from '@mui/icons-material/EditNote';
import ScheduleIcon from '@mui/icons-material/Schedule';

import type { NextPageParams } from '@lib/NextRouterParams';
import type { TimelineEvent } from '@beverloo/volunteer-manager-timeline';
import { ExpandableSection } from '@app/admin/components/ExpandableSection';
import { generateEventMetadataFn } from '../../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tHotelsPreferences, tRefunds, tRoles, tSchedule, tShifts, tStorage, tTeams,
    tTrainingsAssignments, tUsers, tUsersEvents } from '@lib/database';

import { ApplicationAvailability } from './ApplicationAvailability';
import { ApplicationHotelPreferences } from './ApplicationHotelPreferences';
import { ApplicationMetadata } from './ApplicationMetadata';
import { ApplicationPreferences } from './ApplicationPreferences';
import { ApplicationRefundRequest } from './ApplicationRefundRequest';
import { ApplicationTrainingPreferences } from './ApplicationTrainingPreferences';
import { RegistrationStatus } from '@lib/database/Types';
import { VolunteerHeader } from './VolunteerHeader';
import { VolunteerIdentity } from './VolunteerIdentity';
import { VolunteerNotes } from './VolunteerNotes';
import { VolunteerSchedule } from './VolunteerSchedule';
import { getHotelRoomOptions } from '@app/registration/[slug]/application/hotel/getHotelRoomOptions';
import { getTrainingOptions } from '@app/registration/[slug]/application/training/getTrainingOptions';
import { getPublicEventsForFestival, type EventTimeslotEntry } from '@app/registration/[slug]/application/availability/getPublicEventsForFestival';
import { getShiftsForEvent } from '@app/admin/lib/getShiftsForEvent';
import { readSetting } from '@lib/Settings';
import { readUserSettings } from '@lib/UserSettings';

type RouterParams = NextPageParams<'event' | 'team' | 'volunteer'>;

/**
 * Displays information about an individual volunteer and their participation in a particular event.
 * Different from the general volunteer account information page, which can only be accessed by a
 * more limited number of people.
 */
export default async function EventVolunteerPage(props: RouterParams) {
    const { access, user, event, team } = await verifyAccessAndFetchPageInfo(props.params);

    const accessScope = { event: event.slug, team: team.slug };
    if (!access.can('event.volunteers.information', 'read', accessScope))
        notFound();

    const readOnly = access.can('event.volunteers.information', 'update', accessScope);

    const storageJoin = tStorage.forUseInLeftJoin();

    // ---------------------------------------------------------------------------------------------

    const dbInstance = db;
    const volunteer = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .leftJoin(storageJoin)
            .on(storageJoin.fileId.equals(tUsers.avatarId))
        .where(tUsersEvents.userId.equals(parseInt(props.params.volunteer, 10)))
            .and(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.teamId.equals(team.id))
            .and(tUsersEvents.registrationStatus.in(
                [ RegistrationStatus.Accepted, RegistrationStatus.Cancelled ]))
        .select({
            userId: tUsersEvents.userId,
            username: tUsers.username,
            firstName: tUsers.firstName,
            name: tUsers.name,
            avatarFileHash: storageJoin.fileHash,
            phoneNumber: tUsers.phoneNumber,
            roleId: tUsersEvents.roleId,
            roleName: tRoles.roleName,
            registrationDate: dbInstance.dateTimeAsString(tUsersEvents.registrationDate),
            registrationStatus: tUsersEvents.registrationStatus,
            registrationNotes: tUsersEvents.registrationNotes,
            availabilityEventLimit: tUsersEvents.availabilityEventLimit,
            availabilityExceptions: tUsersEvents.availabilityExceptions,
            availabilityTimeslots: tUsersEvents.availabilityTimeslots,
            hotelEligible: tUsersEvents.hotelEligible,
            trainingEligible: tUsersEvents.trainingEligible,
            credits: tUsersEvents.includeCredits,
            preferences: tUsersEvents.preferences,
            serviceHours: tUsersEvents.preferenceHours,
            preferenceTimingStart: tUsersEvents.preferenceTimingStart,
            preferenceTimingEnd: tUsersEvents.preferenceTimingEnd,
            socials: tUsersEvents.includeSocials,
            tshirtFit: tUsersEvents.shirtFit,
            tshirtSize: tUsersEvents.shirtSize,

            actualAvailableEventLimit: tUsersEvents.availabilityEventLimit.valueWhenNull(
                tRoles.roleAvailabilityEventLimit),
            isHotelEligible: tUsersEvents.hotelEligible.valueWhenNull(tRoles.roleHotelEligible),
            isTrainingEligible:
                tUsersEvents.trainingEligible.valueWhenNull(tRoles.roleTrainingEligible),
        })
        .executeSelectNoneOrOne();

    if (!volunteer)
        notFound();

    const contactAccess = access.can('volunteer.pii') || access.can('volunteer.account');
    const contactInfo =
        contactAccess ? { username: volunteer.username, phoneNumber: volunteer.phoneNumber }
                      : undefined;

    // ---------------------------------------------------------------------------------------------
    // Schedule:
    // ---------------------------------------------------------------------------------------------

    const schedule: TimelineEvent[] = [];
    const scheduledShifts = await dbInstance.selectFrom(tSchedule)
        .innerJoin(tShifts)
            .on(tShifts.shiftId.equals(tSchedule.shiftId))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tShifts.teamId))
        .where(tSchedule.eventId.equals(event.id))
            .and(tSchedule.userId.equals(volunteer.userId))
            .and(tSchedule.shiftId.isNotNull())
            .and(tSchedule.scheduleDeleted.isNull())
        .select({
            id: tSchedule.scheduleId,
            start: tSchedule.scheduleTimeStart,
            end: tSchedule.scheduleTimeEnd,
            title: tShifts.shiftName,

            shiftId: tSchedule.shiftId,
            shiftTeam: tTeams.teamSlug,
        })
        .executeSelectMany();

    if (!!scheduledShifts.length && !!event.festivalId) {
        const shifts = await getShiftsForEvent(event.id, event.festivalId);
        const shiftMap = new Map(shifts.map(shift => ([ shift.id, shift.colour ])));

        for (const scheduledShift of scheduledShifts) {
            schedule.push({
                id: scheduledShift.id,
                start: scheduledShift.start.toString({ timeZoneName: 'never' }),
                end: scheduledShift.end.toString({ timeZoneName: 'never' }),
                color: shiftMap.get(scheduledShift.shiftId!),
                title: scheduledShift.title,

                // Private data to enable double clicking on shift entries:
                animeConShiftId: scheduledShift.shiftId!,
                animeConShiftTeam: scheduledShift.shiftTeam,
            });
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Availability preferences:
    // ---------------------------------------------------------------------------------------------

    let publicEvents: EventTimeslotEntry[] = [];
    if (!!event.festivalId && volunteer.actualAvailableEventLimit > 0)
        publicEvents = await getPublicEventsForFestival(event.festivalId, event.timezone);

    // ---------------------------------------------------------------------------------------------
    // Hotel preferences:
    // ---------------------------------------------------------------------------------------------

    let hotelManagement: React.ReactNode = undefined;
    if (access.can('event.hotels', { event: event.slug }) && !!volunteer.isHotelEligible) {
        const hotelOptions = await getHotelRoomOptions(event.id);
        const hotelPreferences = await dbInstance.selectFrom(tHotelsPreferences)
            .where(tHotelsPreferences.userId.equals(volunteer.userId))
                .and(tHotelsPreferences.eventId.equals(event.id))
                .and(tHotelsPreferences.teamId.equals(team.id))
            .select({
                hotelId: tHotelsPreferences.hotelId,
                sharingPeople: tHotelsPreferences.hotelSharingPeople,
                sharingPreferences: tHotelsPreferences.hotelSharingPreferences,
                checkIn: dbInstance.dateAsString(tHotelsPreferences.hotelDateCheckIn),
                checkOut: dbInstance.dateAsString(tHotelsPreferences.hotelDateCheckOut),
            })
            .executeSelectNoneOrOne() ?? undefined;

        hotelManagement = (
            <ApplicationHotelPreferences eventDate={event.startTime}
                                         eventSlug={event.slug} hotelOptions={hotelOptions}
                                         hotelPreferences={hotelPreferences}
                                         teamSlug={team.slug} volunteerUserId={volunteer.userId} />
        );
    }

    // ---------------------------------------------------------------------------------------------
    // Refund request:
    // ---------------------------------------------------------------------------------------------

    let refundRequest: React.ReactNode = undefined;
    if (access.can('event.refunds', { event: event.slug })) {
        const refund = await db.selectFrom(tRefunds)
            .where(tRefunds.userId.equals(volunteer.userId))
                .and(tRefunds.eventId.equals(event.id))
            .select({
                ticketNumber: tRefunds.refundTicketNumber,
                accountIban: tRefunds.refundAccountIban,
                accountName: tRefunds.refundAccountName,
            })
            .executeSelectNoneOrOne() ?? undefined;

        refundRequest = (
            <ApplicationRefundRequest eventSlug={event.slug} refund={refund}
                                      volunteerUserId={volunteer.userId} />
        );
    }

    // ---------------------------------------------------------------------------------------------
    // Training preferences:
    // ---------------------------------------------------------------------------------------------

    let trainingManagement: React.ReactNode = undefined;
    if (access.can('event.trainings', { event: event.slug }) && !!volunteer.isTrainingEligible) {
        const trainingOptions = await getTrainingOptions(event.id);
        const training = await db.selectFrom(tTrainingsAssignments)
            .where(tTrainingsAssignments.eventId.equals(event.id))
                .and(tTrainingsAssignments.assignmentUserId.equals(volunteer.userId))
            .select({
                preference: tTrainingsAssignments.preferenceTrainingId,
            })
            .executeSelectNoneOrOne() ?? undefined;

        trainingManagement = (
            <ApplicationTrainingPreferences eventSlug={event.slug} teamSlug={team.slug}
                                            trainingOptions={trainingOptions} training={training}
                                            volunteerUserId={volunteer.userId} />
        );
    }

    // ---------------------------------------------------------------------------------------------

    const availabilityStep = await readSetting('availability-time-step-minutes');
    const settings = await readUserSettings(user.userId, [
        'user-admin-volunteers-expand-notes',
        'user-admin-volunteers-expand-shifts',
    ]);

    const notesExpanded = !!settings['user-admin-volunteers-expand-notes'];
    const scheduleExpanded = !!settings['user-admin-volunteers-expand-shifts'];

    const scheduleSubTitle = `${schedule.length} shift${schedule.length !== 1 ? 's' : ''}`;

    const canAccessAccountInformation = access.can('volunteer.account.information', 'read');
    const canAccessOverrides = access.can('event.volunteers.overrides', accessScope);
    const canUpdateApplications = access.can('event.applications', 'update', accessScope);
    const canUpdateParticipation = access.can('event.volunteers.participation', accessScope);
    const canUpdateWithoutNotification = access.can('volunteer.silent');

    return (
        <>
            <VolunteerHeader canAccessAccountInformation={canAccessAccountInformation}
                             canUpdateApplications={canUpdateApplications}
                             canUpdateParticipation={canUpdateParticipation}
                             canUpdateWithoutNotification={canUpdateWithoutNotification}
                             event={event} team={team} volunteer={volunteer} user={user} />
            <VolunteerIdentity event={event.slug} teamId={team.id} userId={volunteer.userId}
                               contactInfo={contactInfo} volunteer={volunteer} />
            <ExpandableSection icon={ <EditNoteIcon color="info" /> } title="Notes"
                               defaultExpanded={notesExpanded}
                               setting="user-admin-volunteers-expand-notes">
                <VolunteerNotes event={event.slug} team={team.slug} volunteer={volunteer} />
            </ExpandableSection>
            { !!schedule.length &&
                <ExpandableSection icon={ <ScheduleIcon color="info" /> } title="Schedule"
                                   subtitle={scheduleSubTitle} defaultExpanded={scheduleExpanded}
                                   setting="user-admin-volunteers-expand-shifts">
                    <VolunteerSchedule event={event} schedule={schedule} />
                </ExpandableSection> }
            <ApplicationPreferences event={event.slug} team={team.slug} readOnly={readOnly}
                                    volunteer={volunteer} />
            <ApplicationAvailability event={event} events={publicEvents} step={availabilityStep}
                                     team={team.slug} readOnly={readOnly} volunteer={volunteer} />
            {hotelManagement}
            {refundRequest}
            {trainingManagement}
            { canAccessOverrides &&
                <ApplicationMetadata event={event.slug} team={team.slug} volunteer={volunteer} /> }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Volunteer');
