'use client';

import React from 'react';
import type { InvoiceData } from "@/services/invoice-service";
import { OrderInvoice } from "./order-invoice";
import { AppointmentInvoice } from "./appointment-invoice";
import { ExemptServiceInvoice } from "./exempt-service-invoice";

export function Invoice({ invoice }: { invoice: InvoiceData }) {
    if (invoice.invoiceType === 'booking') {
        // a clinical service carries no GST and says so; a taxable one shows the 18% split
        if ((invoice as any).taxCategory === 'exempt_clinical') return <ExemptServiceInvoice invoice={invoice} />;
        return <AppointmentInvoice invoice={invoice} />;
    }
    return <OrderInvoice invoice={invoice} />;
}
