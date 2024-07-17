// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use server';

import { Temporal } from '@lib/Temporal';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tEventsSales } from '@lib/database';

/**
 * React Server Action that deals with uploading the sales report. The data will be parsed into the
 * format we expect, then inserted into the database in the different known categories.
 */
export async function uploadSalesReport(prevState: any, formData: FormData) {
    if (!formData.has('event') || typeof formData.get('event') !== 'string')
        return { success: false, error: 'Unclear which event the sales report belongs to…' };

    if (!formData.has('file') || !(formData.get('file') instanceof File))
        return { success: false, error: 'Unclear what sales report is being shared…' };

    const event = await getEventBySlug(formData.get('event') as string);
    if (!event)
        return { success: false, error: 'The right event could not be selected on the server…' };

    const uploadedReport = formData.get('file') as File;
    const uploadedReportData = await uploadedReport.text();
    const uploadedReportLines = uploadedReportData.split(/\r?\n/);

    if (uploadedReportLines.length < 2)
        return { success: false, error: 'The selected file does not contain a sales report…' };

    // YTP includes a line that signals what separator is being used. We boldly assume use of a
    // comma, so will ignore the indication altogether.
    if (uploadedReportLines[0].startsWith('sep='))
        uploadedReportLines.shift();

    const kSeparator = ',';

    const fields: string[] = [];
    {
        const uploadedReportHeader = uploadedReportLines.shift()!.trim();
        for (const field of uploadedReportHeader.split(kSeparator))
            fields.push(field);
    }

    for (const requiredField of [ 'Datum', 'Weekend', 'Friday', 'Saturday', 'Sunday' ]) {
        if (!fields.includes(requiredField))
            return { success: false, error: 'The selected file misses a required field…' };
    }

    const data = [];
    {
        for (const uploadedReportLine of uploadedReportLines) {
            const report = uploadedReportLine.trim().split(kSeparator);
            if (report.length !== fields.length)
                return { success: false, error: 'The selected file contains inconsistent data…' };

            data.push(Object.fromEntries(report.map((value, index) =>
                [ fields[index], value ])));
        }
    }

    if (!data.length)
        return { success: false, error: 'The select file contains no sales data…' };

    // ---------------------------------------------------------------------------------------------
    // Actually upload the `data` to the database.
    // ---------------------------------------------------------------------------------------------

    const dbInstance = db;

    for (const day of data) {
        const dateDecomposed = day.Datum.split('/');
        const date = Temporal.PlainDate.from(
            `${dateDecomposed[2]}-${dateDecomposed[1]}-${dateDecomposed[0]}`);

        for (const field of fields) {
            if (field === 'Datum')
                continue;  // represents the date

            await db.insertInto(tEventsSales)
                .set({
                    eventId: event.id,
                    eventSaleDate: date,
                    eventSaleType: field,
                    eventSaleCount: parseInt(day[field], 10),
                    eventSaleUpdated: dbInstance.currentZonedDateTime(),
                })
                .onConflictDoUpdateSet({
                    eventSaleCount: parseInt(day[field], 10),
                    eventSaleUpdated: dbInstance.currentZonedDateTime(),
                })
                .executeInsert();
        }
    }

    return { success: true };
}
