// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import type { ShiftDemandTimelineGroup, ShiftEntry, ShiftGroup } from './ShiftDemandTimeline';
import { CollapsableSection } from '@app/admin/components/CollapsableSection';
import { Privilege, can } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { ShiftDemandSection } from './ShiftDemandSection';
import { generateEventMetadataFn } from '../../../generateEventMetadataFn';
import { readSetting } from '@lib/Settings';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tActivitiesTimeslots, tShifts } from '@lib/database';

import { kShiftDemand } from '@app/api/admin/event/shifts/[[...id]]/demand';

/**
 * This page displays an individual shift, its configuration, time allocation and warnings. The
 * actual volunteers cannot be adjusted; this is something that has to be done on the schedule page.
 */
export default async function EventTeamShiftPage(props: NextRouterParams<'slug' | 'team' | 'id'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);

    const readOnly = !can(user, Privilege.EventShiftManagement);
    const warnings: any[] = [ ];

    const step = await readSetting('schedule-time-step-minutes');

    // ---------------------------------------------------------------------------------------------

    const shift = await db.selectFrom(tShifts)
        .where(tShifts.shiftId.equals(parseInt(props.params.id)))
            .and(tShifts.eventId.equals(event.id))
            .and(tShifts.teamId.equals(team.id))
            .and(tShifts.shiftDeleted.isNull())
        .select({
            id: tShifts.shiftId,
            name: tShifts.shiftName,
            activityId: tShifts.shiftActivityId,
            demand: tShifts.shiftDemand,
        })
        .executeSelectNoneOrOne();

    if (!shift)
        notFound();

    // ---------------------------------------------------------------------------------------------
    // Compose the information required for the Volunteering Demand section. This combines timeslots
    // sourced from the festival program, shifts from the `team`, and shifts from other teams.
    // ---------------------------------------------------------------------------------------------

    const immutableGroups: ShiftDemandTimelineGroup[] = [];
    if (!!shift.activityId) {
        const dbInstance = db;
        const timeslots = await dbInstance.selectFrom(tActivitiesTimeslots)
            .where(tActivitiesTimeslots.activityId.equals(shift.activityId))
                .and(tActivitiesTimeslots.timeslotDeleted.isNull())
            .select({
                id: tActivitiesTimeslots.timeslotId,
                start: tActivitiesTimeslots.timeslotStartTime,
                end: tActivitiesTimeslots.timeslotEndTime,
            })
            .executeSelectMany();

        if (timeslots.length) {
            immutableGroups.push({
                entries: timeslots.map(timeslot => ({
                    id: timeslot.id,
                    start: timeslot.start.toString({ timeZoneName: 'never' }),
                    end: timeslot.end.toString({ timeZoneName: 'never' }),
                    group: 'timeslot',
                })),
                metadata: {
                    id: 'timeslot',
                    label: 'Timeslot',
                    color: '#ffeb3b',
                },
            });
        }



        // TODO: Shifts from other teams.
    }

    const mutableEntries: ShiftEntry[] = [];
    if (!!shift.demand) {
        try {
            const demand = JSON.parse(shift.demand);
            kShiftDemand.parse(demand);  // throws on invalid data

            for (let id = 0; id < demand.length; ++id) {
                mutableEntries.push({
                    id: 1000 * team.id + id,
                    start: demand[id].start,
                    end: demand[id].end,
                    group: team.id,
                    volunteers: demand[id].volunteers,
                });
            }
        } catch (error: any) {
            console.error(`Ignoring stored shift demand data: ${error.message}`, shift.demand);
        }
    }

    const mutableGroup: ShiftGroup = {
        id: team.id,
        label: {
            singular: team.plural.replace(/s$/, ''),
            plural: team.plural,
        },
        color: team.colour,
    };



    return (
        <>
            <Section title={`${shift.name} shift`}>
                <SectionIntroduction important>
                    The shifts tool has not been implemented yet.
                </SectionIntroduction>
            </Section>
            <Section title="Volunteering demand">
                <SectionIntroduction important={!mutableEntries.length}>
                    Indicate what the agreed volunteering demand for this shift is: how many people
                    are expected to be scheduled on this shift, and when.
                </SectionIntroduction>
                <ShiftDemandSection event={event} team={team} immutableGroups={immutableGroups}
                                    mutableGroup={mutableGroup} mutableEntries={mutableEntries}
                                    readOnly={readOnly} shiftId={shift.id} step={step} />
            </Section>
            <CollapsableSection in={!!warnings.length} title="Shift warnings">
                <SectionIntroduction important>
                    The shifts tool has not been implemented yet.
                </SectionIntroduction>
            </CollapsableSection>
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Shifts');
