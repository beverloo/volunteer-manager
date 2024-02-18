// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../../createDataTableApi';
import { ExportType, LogSeverity, WhatsAppChannelApplications } from '@lib/database/Types';
import { LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tWhatsApp, tUsers } from '@lib/database';

/**
 * Row model for a WhatsApp recipient.
 */
const kWhatsAppRecipientRowModel = z.object({
    /**
     * Unique ID of the WhatsApp registration.
     */
    id: z.number(),

    /**
     * Unique ID of the user who should be receiving messages.
     */
    userId: z.number(),

    /**
     * Full name of the user who should be receiving messages.
     */
    username: z.string(),

    /**
     * Which messages should be sent over the "applications" channel, which informs recipients about
     * newly received volunteering applications?
     */
    channelApplications: z.nativeEnum(WhatsAppChannelApplications).optional(),
});

/**
 * The WhatsApp recipient API does not require any context.
 */
const kWhatsAppRecipientContext = z.never();

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type WhatsAppEndpoints =
    DataTableEndpoints<typeof kWhatsAppRecipientRowModel, typeof kWhatsAppRecipientContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type WhatsAppRowModel = z.infer<typeof kWhatsAppRecipientRowModel>;

/**
 * The WhatsApp API is implemented as a regular, editable DataTable API. All operations are only
 * available to people with the SystemWhatsAppAccess privilege.
 */
export const { DELETE, GET, POST, PUT } =
createDataTableApi(kWhatsAppRecipientRowModel, kWhatsAppRecipientContext, {
    accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin',
            privilege: Privilege.SystemWhatsAppAccess,
        });
    },

    async create({ row }, props) {
        const insertId = await db.insertInto(tWhatsApp)
            .set({
                whatsappUserId: props.user!.userId,
                whatsappChannelApplications: null,
            })
            .returningLastInsertedId()
            .executeInsert();

        return {
            success: true,
            row: {
                id: insertId,
                userId: props.user!.userId,
                username: `${props.user!.firstName} ${props.user?.lastName}`,
                channelApplications: undefined,
            },
        };
    },

    async delete({ id }) {
        const affectedRows = await db.deleteFrom(tWhatsApp)
            .where(tWhatsApp.whatsappId.equals(id))
            .executeDelete();

        return { success: !!affectedRows };
    },

    async list(context, props) {
        const recipients = await db.selectFrom(tWhatsApp)
            .innerJoin(tUsers)
                .on(tUsers.userId.equals(tWhatsApp.whatsappUserId))
            .select({
                id: tWhatsApp.whatsappId,
                userId: tWhatsApp.whatsappUserId,
                username: tUsers.firstName.concat(' ').concat(tUsers.lastName),
                channelApplications: tWhatsApp.whatsappChannelApplications,
            })
            .orderBy('username', 'asc')
            .limit(/* page limit= */ 100)
            .executeSelectPage();

        return {
            success: true,
            rowCount: recipients.count,
            rows: recipients.data,
        };
    },

    async update({ row }, props) {
        const affectedRows = await db.update(tWhatsApp)
            .set({
                whatsappUserId: row.userId,
                whatsappChannelApplications: row.channelApplications
            })
            .where(tWhatsApp.whatsappId.equals(row.id))
            .executeUpdate();

        return { success: !!affectedRows };
    },

    async writeLog({ id }, mutation, props) {
        await Log({
            type: LogType.AdminWhatsAppMutation,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                mutation: mutation,
            },
        });
    },
});
