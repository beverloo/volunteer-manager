// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '@app/api/createDataTableApi';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tRoles, tTeams, tTrainingsAssignments, tTrainingsExtra, tUsersEvents, tUsers }
    from '@lib/database';

/**
 * Row model for a training assignment, as can be shown and modified in the administration area.
 */
const kTrainingAssignmentRowModel = z.object({
    /**
     * Unique ID of this training session. Extra IDs are increased by `kExtraIdentifierOffset` to
     * distinguish them from User IDs.
     */
    id: z.number(),

    /**
     * Full name of the participant.
     */
    name: z.string(),

    /**
     * For volunteers who participate, their unique user ID and team identity, to link them.
     */
    userId: z.number().optional(),
    team: z.string().optional(),

    /**
     * Their preferred training ID. `null` means that they would like to skip. `undefined` means
     * that they have not expressed their preferences yet.
     */
    preferredTrainingId: z.number().nullable().optional(),

    /**
     * Their assigned training ID. `null` means that they are allowed to skip. `undefined` means
     * that the training managers have not made a decision yet.
     */
    assignedTrainingId: z.number().optional(),

    /**
     * Whether the assignment has been confirmed, and can be communicated.
     */
    confirmed: z.boolean(),
});

/**
 * Context required for the API.
 */
const kTrainingAssignmentContext = z.object({
    context: z.object({
        /**
         * Unique slug of the training is in scope of.
         */
        event: z.string(),
    }),
});

/**
 * Enable use of the Training Extra API in `callApi()`.
 */
export type TrainingsAssignmentsEndpoints =
    DataTableEndpoints<typeof kTrainingAssignmentRowModel, typeof kTrainingAssignmentContext>;

/**
 * Row model expected by the Training API.
 */
export type TrainingsAssignmentsRowModel = z.infer<typeof kTrainingAssignmentRowModel>;

/**
 * ID offset used for extras. This is a hack, but it works.
 */
const kExtraIdentifierOffset = 5000000;

/**
 * Implementation of the Training API.
 *
 * The following endpoints are provided by this implementation:
 *
 *     GET    /api/admin/trainings/assignments
 *     PUT    /api/admin/trainings/assignments/:id
 */
export const { GET, PUT } =
createDataTableApi(kTrainingAssignmentRowModel, kTrainingAssignmentContext, {
    async accessCheck({ context }, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: context.event,
            privilege: Privilege.EventTrainingManagement,
        });
    },

    async list({ context, sort }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const trainingsAssignmentsJoin = tTrainingsAssignments.forUseInLeftJoin();

        const dbInstance = db;
        const assignments = await dbInstance.selectFrom(tUsersEvents)
            .innerJoin(tRoles)
                .on(tRoles.roleId.equals(tUsersEvents.roleId))
            .innerJoin(tTeams)
                .on(tTeams.teamId.equals(tUsersEvents.teamId))
            .innerJoin(tUsers)
                .on(tUsers.userId.equals(tUsersEvents.userId))
            .leftJoin(trainingsAssignmentsJoin)
                .on(trainingsAssignmentsJoin.eventId.equals(tUsersEvents.eventId))
                .and(trainingsAssignmentsJoin.assignmentUserId.equals(tUsersEvents.userId))
            .where(tUsersEvents.eventId.equals(event.id))
                .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
                .and(
                    tUsersEvents.trainingEligible.equals(/* true= */ 1).or(
                        tRoles.roleTrainingEligible.equals(/* true= */ 1)))
            .select({
                userId: tUsersEvents.userId,

                name: tUsers.name,
                team: tTeams.teamEnvironment,

                preferenceTrainingId: trainingsAssignmentsJoin.preferenceTrainingId,
                preferenceUpdated: trainingsAssignmentsJoin.preferenceUpdated,

                assignedTrainingId: trainingsAssignmentsJoin.assignmentTrainingId,
                assignedUpdated: trainingsAssignmentsJoin.assignmentUpdatedString,

                confirmed: trainingsAssignmentsJoin.assignmentConfirmed,
            })
            .orderBy('name', 'asc')
            .executeSelectMany();

        const extraParticipants = await dbInstance.selectFrom(tTrainingsExtra)
            .leftJoin(trainingsAssignmentsJoin)
                .on(trainingsAssignmentsJoin.eventId.equals(tTrainingsExtra.eventId))
                .and(trainingsAssignmentsJoin.assignmentExtraId.equals(
                    tTrainingsExtra.trainingExtraId))
            .where(tTrainingsExtra.eventId.equals(event.id))
                .and(tTrainingsExtra.trainingExtraVisible.equals(/* true= */ 1))
            .select({
                id: tTrainingsExtra.trainingExtraId,

                trainingExtraName: tTrainingsExtra.trainingExtraName,
                trainingExtraEmail: tTrainingsExtra.trainingExtraEmail,
                trainingExtraBirthdate: tTrainingsExtra.trainingExtraBirthdateString,

                preferenceTrainingId: trainingsAssignmentsJoin.preferenceTrainingId,
                preferenceUpdated: trainingsAssignmentsJoin.preferenceUpdatedString,

                assignedTrainingId: trainingsAssignmentsJoin.assignmentTrainingId,
                assignedUpdated: trainingsAssignmentsJoin.assignmentUpdatedString,

                confirmed: trainingsAssignmentsJoin.assignmentConfirmed,
            })
            .orderBy(tTrainingsExtra.trainingExtraName, 'asc')
            .executeSelectMany();

        const trainingAssignments: TrainingsAssignmentsRowModel[] = [];
        for (const assignment of [ ...assignments, ...extraParticipants ]) {
            let preferredTrainingId: number | null | undefined = undefined;
            let assignedTrainingId: number | undefined = undefined;

            if (!!assignment.preferenceUpdated)
                preferredTrainingId = assignment.preferenceTrainingId ?? null;

            if (!!assignment.assignedUpdated)
                assignedTrainingId = assignment.assignedTrainingId ?? /* skip= */ 0;

            if ('trainingExtraName' in assignment) {
                trainingAssignments.push({
                    id: kExtraIdentifierOffset + assignment.id,
                    name: assignment.trainingExtraName,

                    preferredTrainingId, assignedTrainingId,
                    confirmed: !!assignment.confirmed,
                });
            } else {
                trainingAssignments.push({
                    id: assignment.userId,
                    name: assignment.name,

                    userId: assignment.userId,
                    team: assignment.team,

                    preferredTrainingId, assignedTrainingId,
                    confirmed: !!assignment.confirmed,
                });
            }
        }

        // Sort the training assignments alphabetically by name of the participant.
        trainingAssignments.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

        return {
            success: true,
            rowCount: trainingAssignments.length,
            rows: trainingAssignments,
        };
    },

    async update({ context, id, row }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        let extraId: number | null = null;
        let userId: number | null = null;

        if (row.id >= kExtraIdentifierOffset)
            extraId = row.id - kExtraIdentifierOffset;
        else
            userId = row.id;

        if (!extraId && !userId)
            return { success: false };

        const dbInstance = db;

        let assignmentTrainingId: null | number;
        let assignmentUpdated: null | ReturnType<typeof dbInstance.currentTimestamp>;

        switch (row.assignedTrainingId) {
            case -1:   // reset
            case null: // new row
                assignmentTrainingId = null;
                assignmentUpdated = null;
                break;

            case 0:     // don't participate
                assignmentTrainingId = null;
                assignmentUpdated = dbInstance.currentTimestamp();
                break;

            default:    // participate
                assignmentTrainingId = row.assignedTrainingId!;
                assignmentUpdated = dbInstance.currentTimestamp();
                break;
        }

        await dbInstance.insertInto(tTrainingsAssignments)
            .set({
                eventId: event.eventId,
                assignmentUserId: userId,
                assignmentExtraId: extraId,
                assignmentTrainingId,
                assignmentUpdated,
                assignmentConfirmed: row.confirmed ? 1 : 0,
            })
            .onConflictDoUpdateSet({
                assignmentTrainingId,
                assignmentUpdated,
                assignmentConfirmed: row.confirmed ? 1 : 0,
            })
            .executeInsert();

        return { success: true };
    },

    async writeLog({ context }, mutation, props) {
        const event = await getEventBySlug(context.event);
        if (!event)
            return;

        await Log({
            type: LogType.AdminEventTrainingAssignment,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                eventName: event!.shortName,
                mutation,
            },
        });
    },
});
