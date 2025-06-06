// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import { DateTimePickerElement, SelectElement, TextFieldElement, TextareaAutosizeElement }
    from '@proxy/react-hook-form-mui';

import EditNoteIcon from '@mui/icons-material/EditNote';
import Grid from '@mui/material/Grid';
import ScheduleIcon from '@mui/icons-material/Schedule';

import type { NextPageParams } from '@lib/NextRouterParams';
import type { ServerAction } from '@lib/serverAction';
import type { TimelineEvent } from '@beverloo/volunteer-manager-timeline';
import { ApplicationParticipationForm } from '@app/registration/[slug]/application/ApplicationParticipation';
import { ExpandableSection } from '@app/admin/components/ExpandableSection';
import { FormGrid } from '@app/admin/components/FormGrid';
import { FormGridSection } from '@app/admin/components/FormGridSection';
import { SectionClearAction } from '@app/admin/components/SectionClearAction';
import { generateEventMetadataFn } from '../../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tHotelsPreferences, tRefunds, tRoles, tSchedule, tShifts, tStorage, tTeams,
    tTrainingsAssignments, tUsers, tUsersEvents } from '@lib/database';

import { ApplicationAvailability } from './ApplicationAvailability';
import { ApplicationRefundRequest } from './ApplicationRefundRequest';
import { ApplicationTrainingPreferences } from './ApplicationTrainingPreferences';
import { HotelPreferencesForm } from '@app/registration/[slug]/application/[team]/hotel/HotelPreferencesForm';
import { VolunteerHeader } from './VolunteerHeader';
import { VolunteerIdentity } from './VolunteerIdentity';
import { VolunteerSchedule } from './VolunteerSchedule';
import { getHotelRoomOptions } from '@app/registration/[slug]/application/[team]/hotel/getHotelRoomOptions';
import { getTrainingOptions } from '@app/registration/[slug]/application/[team]/training/getTrainingOptions';
import { getPublicEventsForFestival, type EventTimeslotEntry }
    from '@app/registration/[slug]/application/[team]/availability/getPublicEventsForFestival';
import { getShiftsForEvent } from '@app/admin/lib/getShiftsForEvent';
import { readSetting } from '@lib/Settings';
import { readUserSettings } from '@lib/UserSettings';

import { kRegistrationStatus } from '@lib/database/Types';

import * as actions from '../VolunteerActions';

/**
 * Options for a binary select box. They look better on the page than checkboxes.
 */
const kBooleanSelectOptions = [
    { id: 1, label: 'Yes' },
    { id: 0, label: 'No' },
];

/**
 * Options for a tri-state binary select box. They look better on the page than checkboxes.
 */
const kTriBooleanSelectOptions = [
    { id: 2, label: '(default)' },
    { id: 1, label: 'Eligible' },
    { id: 0, label: 'Not eligible' },
];

/**
 * Displays information about an individual volunteer and their participation in a particular event.
 * Different from the general volunteer account information page, which can only be accessed by a
 * more limited number of people.
 */
export default async function EventVolunteerPage(
    props: NextPageParams<'event' | 'team' | 'volunteer'>)
{
    const { access, user, event, team } = await verifyAccessAndFetchPageInfo(props.params);

    const accessScope = { event: event.slug, team: team.slug };
    if (!access.can('event.volunteers.information', 'read', accessScope))
        notFound();

    const params = await props.params;
    const readOnly = !access.can('event.volunteers.information', 'update', accessScope);

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
        .where(tUsersEvents.userId.equals(parseInt(params.volunteer, 10)))
            .and(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.teamId.equals(team.id))
            .and(tUsersEvents.registrationStatus.in(
                [ kRegistrationStatus.Accepted, kRegistrationStatus.Cancelled ]))
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
            preferencesDietary: tUsersEvents.preferencesDietary,
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



    // ---------------------------------------------------------------------------------------------
    // Availability preferences:
    // ---------------------------------------------------------------------------------------------

    let publicEvents: EventTimeslotEntry[] = [];
    if (!!event.festivalId && volunteer.actualAvailableEventLimit > 0)
        publicEvents = await getPublicEventsForFestival(event.festivalId, event.timezone);

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
    // TODO TODO TODO TODO TODO

    const settings = await readUserSettings(user.userId, [
        'user-admin-volunteers-expand-notes',
        'user-admin-volunteers-expand-shifts',
    ]);

    const availabilityStep = await readSetting('availability-time-step-minutes');

    const canAccessAccountInformation = access.can('volunteer.account.information', 'read');
    const canUpdateApplications = access.can('event.applications', 'update', accessScope);
    const canUpdateParticipation = access.can('event.volunteers.participation', accessScope);
    const canUpdateWithoutNotification = access.can('volunteer.silent');

    // TODO TODO TODO TODO TODO
    // ---------------------------------------------------------------------------------------------


    // ---------------------------------------------------------------------------------------------
    // Section: Notes
    // ---------------------------------------------------------------------------------------------

    const notesAction = actions.updateNotes.bind(null, user.userId, event.id, team.id);
    const notesExpanded = !!settings['user-admin-volunteers-expand-notes'];

    const notesDefaultValues = {
        notes: volunteer.registrationNotes,
    };

    // ---------------------------------------------------------------------------------------------
    // Section: Schedule
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

    const scheduleEvent = {
        startTime: event.startTime,
        endTime: event.endTime,
        timezone: event.timezone,
    };

    const scheduleExpanded = !!settings['user-admin-volunteers-expand-shifts'];
    const scheduleSubtitle = `${schedule.length} shift${schedule.length !== 1 ? 's' : ''}`;

    // ---------------------------------------------------------------------------------------------
    // Section: Preferences
    // ---------------------------------------------------------------------------------------------

    const preferencesAction = actions.updateApplication.bind(null, user.userId, event.id, team.id);
    const preferencesDefaultValues = {
        credits: volunteer.credits,
        socials: volunteer.socials,
        tshirtFit: volunteer.tshirtFit,
        tshirtSize: volunteer.tshirtSize,
    };

    // ---------------------------------------------------------------------------------------------
    // Section: Availability
    // ---------------------------------------------------------------------------------------------

    // TODO

    // ---------------------------------------------------------------------------------------------
    // Section: Hotel preferences
    // ---------------------------------------------------------------------------------------------

    let hotelAction: ServerAction | undefined;
    let hotelClearAction: ServerAction | undefined;
    let hotelDefaultValues: Record<string, any> | undefined;
    let hotelRooms: undefined | { id: number; label: string }[];

    if (access.can('event.hotels', { event: event.slug }) && !!volunteer.isHotelEligible) {
        hotelAction = actions.updateHotelPreferences.bind(null, user.userId, event.id, team.id);
        hotelClearAction = actions.clearHotelPreferences.bind(null, user.userId, event.id, team.id);

        hotelDefaultValues = await dbInstance.selectFrom(tHotelsPreferences)
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
            .executeSelectNoneOrOne() ?? { /* no default values */ };

        if (typeof hotelDefaultValues.hotelId !== 'undefined')
            hotelDefaultValues.interested = !!hotelDefaultValues.hotelId ? 1 : 0;

        hotelRooms = await getHotelRoomOptions(event.id)
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Refund request
    // ---------------------------------------------------------------------------------------------

    // TODO

    // ---------------------------------------------------------------------------------------------
    // Section: Training preferences
    // ---------------------------------------------------------------------------------------------

    // TODO:

    // ---------------------------------------------------------------------------------------------
    // Section: Metadata
    // ---------------------------------------------------------------------------------------------

    let metadataAction: ServerAction | undefined;
    let metadataDefaultValues: Record<string, any> | undefined;

    if (access.can('event.volunteers.overrides', accessScope)) {
        metadataAction = actions.updateMetadata.bind(null, user.userId, event.id, team.id);
        metadataDefaultValues = {
            availabilityEventLimit: volunteer.availabilityEventLimit,
            hotelEligible: volunteer.hotelEligible ?? /* default= */ 2,
            registrationDate: volunteer.registrationDate,
            trainingEligible: volunteer.trainingEligible ?? /* default= */ 2,
        };
    }

    // ---------------------------------------------------------------------------------------------

    return (
        <>

            <VolunteerHeader canAccessAccountInformation={canAccessAccountInformation}
                             canUpdateApplications={canUpdateApplications}
                             canUpdateParticipation={canUpdateParticipation}
                             canUpdateWithoutNotification={canUpdateWithoutNotification}
                             event={event} team={team} volunteer={volunteer} user={user} />

            <VolunteerIdentity event={event.slug} teamId={team.id} userId={volunteer.userId}
                               contactInfo={contactInfo} volunteer={volunteer} />

            { /* -- Notes: -------------------------------------------------------------------- */ }

            <ExpandableSection icon={ <EditNoteIcon color="info" /> } title="Notes"
                               defaultExpanded={notesExpanded}
                               setting="user-admin-volunteers-expand-notes">
                <FormGrid action={notesAction} defaultValues={notesDefaultValues}>
                    <TextareaAutosizeElement name="notes" fullWidth size="small"
                                             slotProps={{ input: { readOnly } }} />
                </FormGrid>
            </ExpandableSection>

            { /* -- Schedule: ----------------------------------------------------------------- */ }

            { !!schedule.length &&
                <ExpandableSection icon={ <ScheduleIcon color="info" /> } title="Schedule"
                                   subtitle={scheduleSubtitle} defaultExpanded={scheduleExpanded}
                                   setting="user-admin-volunteers-expand-shifts">
                    <VolunteerSchedule event={scheduleEvent} schedule={schedule} />
                </ExpandableSection> }

            { /* -- Preferences: -------------------------------------------------------------- */ }

            <FormGridSection action={preferencesAction} defaultValues={preferencesDefaultValues}
                             title="Preferences">
                <ApplicationParticipationForm readOnly={readOnly} />
                <Grid size={{ xs: 6 }}>
                    <SelectElement name="credits" label="Include on the credit reel?"
                                   options={kBooleanSelectOptions} size="small" fullWidth
                                   slotProps={{ input: { readOnly } }} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <SelectElement name="socials" label="Include on WhatsApp/social channels?"
                                   options={kBooleanSelectOptions} size="small" fullWidth
                                   slotProps={{ input: { readOnly } }} />
                </Grid>
            </FormGridSection>

            { /* ------------------------------------------------------------------------------ */ }

            <ApplicationAvailability event={event} events={publicEvents} step={availabilityStep}
                                     team={team.slug} readOnly={readOnly} volunteer={volunteer} />

            { /* ------------------------------------------------------------------------------ */ }

            { !!hotelAction &&
                <FormGridSection action={hotelAction} defaultValues={hotelDefaultValues}
                                 title="Hotel preferences" permission="event.hotels"
                                 headerAction={
                                     !!hotelClearAction
                                         ? <SectionClearAction action={hotelClearAction}
                                                               subject="hotel preferences"
                                                               title="Clear hotel preferences" />
                                         : undefined
                                 } >
                    <HotelPreferencesForm eventDate={event.startTime}
                                          readOnly={readOnly}
                                          rooms={hotelRooms!} />
                </FormGridSection> }

            { /* ------------------------------------------------------------------------------ */ }

            {refundRequest}

            { /* ------------------------------------------------------------------------------ */ }

            {trainingManagement}

            { /* ------------------------------------------------------------------------------ */ }

            { !!metadataAction &&
                <FormGridSection action={metadataAction} defaultValues={metadataDefaultValues}
                                 title="Application information"
                                 permission="event.volunteers.overrides">
                    <Grid size={{ xs: 6 }}>
                        <DateTimePickerElement name="registrationDate" label="Registration date"
                                               inputProps={{ fullWidth: true, size: 'small' }} />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextFieldElement name="availabilityEventLimit" type="number"
                                          label="Availability event limit override"
                                          fullWidth size="small" />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <SelectElement name="hotelEligible" label="Hotel eligibility override"
                                       options={kTriBooleanSelectOptions} fullWidth size="small" />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <SelectElement name="trainingEligible" label="Training eligibility override"
                                       options={kTriBooleanSelectOptions} fullWidth size="small" />
                    </Grid>
                </FormGridSection> }

        </>
    );
}

export async function generateMetadata(props: NextPageParams<'event' | 'volunteer'>) {
    const userName = await db.selectFrom(tUsers)
        .where(tUsers.userId.equals(parseInt((await props.params).volunteer, 10)))
        .selectOneColumn(tUsers.name)
        .executeSelectNoneOrOne() ?? undefined;

    return generateEventMetadataFn(userName)(props);
}
