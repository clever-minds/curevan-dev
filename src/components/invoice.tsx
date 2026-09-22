'use client';

import React from 'react';
import type { InvoiceData } from "@/services/invoice-service";
import { OrderInvoice } from "./order-invoice";
import { AppointmentInvoice } from "./appointment-invoice";

export function Invoice({ invoice }: { invoice: InvoiceData }) {
    if (invoice.invoiceType === 'booking') {
        return <AppointmentInvoice invoice={invoice} />;
    }
    return <OrderInvoice invoice={invoice} />;
}
