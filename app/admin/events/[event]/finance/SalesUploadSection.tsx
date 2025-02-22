// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { z } from 'zod';

import { default as MuiLink } from '@mui/material/Link';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import Grid from '@mui/material/Grid2';

import { FormGridSection } from '@app/admin/components/FormGridSection';
import { SalesUploadInput } from './SalesUploadInput';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { Temporal } from '@lib/Temporal';
import { executeServerAction } from '@lib/serverAction';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tEventsSales } from '@lib/database';

/**
 * Validation that will be applied to confirm a complete, valid sales upload.
 */
const kSalesUploadData = z.object({
    /**
     * The file that has been uploaded by the user. It will be a CSV file with the sales data.
     */
    file: z.array(z.instanceof(File)).nonempty(),
});

/**
 * React Server Action that deals with uploading the sales report. The data will be parsed into the
 * format we expect, then inserted into the database in the different known categories.
 */
export async function salesUpload(eventSlug: string, formData: unknown) {
    'use server';
    console.log(formData);

    return executeServerAction(formData, kSalesUploadData, async (data, props) => {
        const event = await getEventBySlug(eventSlug);
        if (!event)
            return { success: false, error: 'The right event could not be selected on the server…' };

        const uploadedReportData = await data.file[0].text();
        const uploadedReportLines = uploadedReportData.split(/\r?\n/);

        if (uploadedReportLines.length < 2)
            return { success: false, error: 'The selected file does not contain a sales report…' };

        let separator = ',';

        if (uploadedReportLines[0].startsWith('sep=')) {
            separator = uploadedReportLines[0].substring(4);
            if (separator.length !== 1)
                return { success: false, error: `Unrecognised separator: ${separator}` };

            uploadedReportLines.shift();
        }

        const fields: string[] = [];
        {
            const uploadedReportHeader = uploadedReportLines.shift()!.trim();
            for (const field of uploadedReportHeader.split(separator))
                fields.push(field.trim());
        }

        if (!fields.includes('Datum'))
            return { success: false, error: 'The selected file misses the "Datum" field…' };

        const salesData = [];
        {
            for (const uploadedReportLine of uploadedReportLines) {
                const report = uploadedReportLine.trim().split(separator);
                if (report.length !== fields.length)
                    return { success: false, error: 'The selected file contains inconsistent data…' };

                salesData.push(Object.fromEntries(report.map((value, index) =>
                    [ fields[index], value ])));
            }
        }

        if (!salesData.length)
            return { success: false, error: 'The select file contains no sales data…' };

        // ---------------------------------------------------------------------------------------------
        // Actually upload the `data` to the database.
        // ---------------------------------------------------------------------------------------------

        const dbInstance = db;

        for (const day of salesData) {
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

        // Refresh the rest of the page, as both graphs and further sales configuration may have
        // been invalidated based on the newly uploaded data.
        return { success: true, refresh: true };
    });
}

/**
 * Props accepted by the <EventSales> component.
 */
interface EventSalesProps {
    /**
     * Slug of the event for which sales information is being imported.
     */
    event: string;
}

/**
 * The <SalesUploadSection> component allows the latest event sales information to be imported into
 * the portal. The data can only be sourced from the external ticketing agent, and will be stored in
 * aggregate in our own databases.
 */
export function SalesUploadSection(props: EventSalesProps) {
    const action = salesUpload.bind(null, props.event);
    const link = 'https://www.yourticketprovider.nl/account/events/manage/myevents.aspx';

    return (
        <FormGridSection action={action} title="Import sales data"
                         icon={ <AutoGraphOutlinedIcon /> }>
            <Grid size={12}>
                <SectionIntroduction>
                    Aggregated information can be imported from our{' '}
                    <MuiLink component={Link} href={link}>ticketing partner</MuiLink>:
                    navigate to an event, then <em>Rapports</em>, then <em>Sales</em>, then
                    download the daily statistics for products and tickets.
                </SectionIntroduction>
            </Grid>
            <Grid size={12}>
                <SalesUploadInput />
            </Grid>
        </FormGridSection>
    );
}
