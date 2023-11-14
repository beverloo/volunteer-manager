// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '@app/api/createDataTableApi';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { ShirtFit, ShirtSize, VendorGender, VendorTeam } from '@lib/database/Types';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tVendors } from '@lib/database';

/**
 * Row model for vendor entry, as can be shown and modified in the administration area.
 */
const kVendorRowModel = z.object({
    /**
     * Unique ID of the vendor.
     */
    id: z.number(),

    /**
     * First name of the vendor, which must be provided.
     */
    firstName: z.string().min(1),

    /**
     * Last name of the vendor, which must be provided.
     */
    lastName: z.string().min(1),

    /**
     * Gender of the vendor. Used for statistical purposes.
     */
    gender: z.nativeEnum(VendorGender),

    /**
     * T-shirt size of the vendor, only if they should be granted one. The empty string is used to
     * reset the shirt size to a null value.
     */
    shirtSize: z.nativeEnum(ShirtSize).or(z.literal(' ')).optional(),

    /**
     * T-shirt fit of the vendor, only if they should be granted one. The empty string is used to
     * reset the shirt fit to a null value.
     */
    shirtFit: z.nativeEnum(ShirtFit).or(z.literal(' ')).optional(),
});

/**
 * Context required for the Vendor API.
 */
const kVendorContext = z.object({
    context: z.object({
        /**
         * Unique slug of the event refund request should be considered for.
         */
        event: z.string(),

        /**
         * Unique name of the vendor team that is being consulted.
         */
        team: z.nativeEnum(VendorTeam),
    }),
});

/**
 * Enable use of the Vendor API in `callApi()`.
 */
export type VendorEndpoints = DataTableEndpoints<typeof kVendorRowModel, typeof kVendorContext>;

/**
 * Row model expected by the Vendor API.
 */
export type VendorRowModel = z.infer<typeof kVendorRowModel>;

/**
 * Scope expected by the Vendor API.
 */
export type VendorScope = z.infer<typeof kVendorContext>['context'];

/**
 * Implementation of the Vendor API.
 *
 * The following endpoints are provided by this implementation:
 *
 *     GET    /api/admin/vendors/:event/:team
 *     POST   /api/admin/vendors/:event/:team
 *     DELETE /api/admin/vendors/:event/:team
 *     PUT    /api/admin/vendors/:event/:team/:id
 */
export const { DELETE, POST, PUT, GET } = createDataTableApi(kVendorRowModel, kVendorContext, {
    async accessCheck({ context }, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: context.event,
            privilege: Privilege.EventSupportingTeams,
        });
    },

    async create({ context }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const dbInstance = db;
        const insertId = await dbInstance.insertInto(tVendors)
            .set({
                eventId: event.eventId,
                vendorTeam: context.team,
                vendorFirstName: 'First',
                vendorLastName: 'Name',
                vendorGender: VendorGender.Other,
                vendorShirtFit: null,
                vendorShirtSize: null,
                vendorModified: dbInstance.currentDateTime(),
                vendorVisible: /* true= */ 1,
            })
            .returningLastInsertedId()
            .executeInsert();

        return {
            success: true,
            row: {
                id: insertId,
                firstName: 'First',
                lastName: 'Name',
                gender: VendorGender.Other,
            }
        };
    },

    async delete({ context, id }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const affectedRows = await db.update(tVendors)
            .set({ vendorVisible: /* false= */ 0 })
            .where(tVendors.vendorId.equals(id))
                .and(tVendors.eventId.equals(event.eventId))
                .and(tVendors.vendorVisible.equals(/* true= */ 1))
            .executeUpdate();

        return { success: !!affectedRows };
    },

    async list({ context }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const vendors = await db.selectFrom(tVendors)
            .where(tVendors.eventId.equals(event.eventId))
                .and(tVendors.vendorVisible.equals(/* true= */ 1))
            .select({
                id: tVendors.vendorId,
                firstName: tVendors.vendorFirstName,
                lastName: tVendors.vendorLastName,
                gender: tVendors.vendorGender,
                shirtSize: tVendors.vendorShirtSize,
                shirtFit: tVendors.vendorShirtFit,
            })
            .orderBy('firstName', 'asc')
            .executeSelectPage();

        return {
            success: true,
            rowCount: vendors.count,
            rows: vendors.data,
        };
    },

    async update({ context, id, row }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const shirtFit = row.shirtFit === ' ' ? null : (row.shirtFit ?? null);
        const shirtSize = row.shirtSize === ' ' ? null : (row.shirtSize ?? null);

        const dbInstance = db;
        const affectedRows = await dbInstance.update(tVendors)
            .set({
                vendorFirstName: row.firstName,
                vendorLastName: row.lastName,
                vendorGender: row.gender,
                vendorShirtFit: shirtFit,
                vendorShirtSize: shirtSize,
                vendorModified: dbInstance.currentDateTime()
            })
            .where(tVendors.eventId.equals(event.eventId))
                .and(tVendors.vendorId.equals(id))
                .and(tVendors.vendorVisible.equals(/* true= */ 1))
            .executeUpdate();

        return { success: !!affectedRows };
    },

    async writeLog({ context, id }, mutation, props) {
        const event = await getEventBySlug(context.event);

        const kReadableTeamName: { [k in VendorTeam]: string } = {
            [VendorTeam.FirstAid]: 'First Aid',
            [VendorTeam.Security]: 'Security',
        };

        await Log({
            type: LogType.AdminVendorMutation,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            targetUser: id,
            data: {
                event: event?.shortName,
                mutation,
                team: kReadableTeamName[context.team],
            },
        });
    },
});
