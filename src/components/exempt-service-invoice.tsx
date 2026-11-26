'use client';

import { Card } from "@/components/ui/card";
import Logo from "./logo";
import { Price } from "./money/price";
import { GstinWarning, SupplierDetails } from "./invoice-supplier";
import type { InvoiceData } from "@/services/invoice-service";

/** Invoice of a clinical (exempt) service: no GST lines, the exemption is stated. */
export function ExemptServiceInvoice({ invoice }: { invoice: InvoiceData }) {
  const date = new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const item = invoice.items[0];
  return (
    <Card className="max-w-[210mm] mx-auto my-8 p-0 border shadow-lg print:shadow-none print:border-none print:m-0 bg-white text-[11px] font-sans text-black leading-tight">
      <GstinWarning supplier={invoice.supplier} />
      <div className="border border-gray-400 m-4 print:m-0" data-testid="exempt-invoice">
        <div className="grid grid-cols-[1fr_2fr_1.2fr] border-b border-gray-400">
          <div className="p-4 flex items-center justify-center border-r border-gray-400"><Logo className="h-14 w-auto" /></div>
          <div className="p-4 text-center border-r border-gray-400">
            <h1 className="text-base font-black uppercase mb-1">{invoice.supplier.legalName}</h1>
            <SupplierDetails supplier={invoice.supplier} />
          </div>
          <div className="p-4 flex flex-col justify-center items-end"><h2 className="text-3xl font-black uppercase tracking-tighter">Invoice</h2></div>
        </div>

        <div className="grid grid-cols-2 border-b border-gray-400">
          <div className="p-3 border-r border-gray-400 space-y-1">
            <p><span className="font-bold">Invoice #</span> {invoice.invoiceNumber}</p>
            <p><span className="font-bold">Date</span> {date}</p>
            <p><span className="font-bold">Place of supply</span> {invoice.placeOfSupply}</p>
          </div>
          <div className="p-3 space-y-1">
            <p className="font-black uppercase text-[13px]">{invoice.customer.name}</p>
            <p>{invoice.customer.billingAddress?.address}</p>
            <p>{invoice.customer.billingAddress?.city}, {invoice.customer.billingAddress?.state} - {invoice.customer.billingAddress?.pincode}</p>
          </div>
        </div>

        <div className="grid grid-cols-[3fr_1fr] border-b border-gray-400 bg-gray-100 font-bold uppercase text-[10px]">
          <div className="p-2 border-r border-gray-400">Service</div>
          <div className="p-2 text-right">Amount</div>
        </div>
        <div className="grid grid-cols-[3fr_1fr] border-b border-gray-400">
          <div className="p-2 border-r border-gray-400">{item?.name || 'Home therapy session'}</div>
          <div className="p-2 text-right"><Price amount={invoice.totalAmount} showDecimals /></div>
        </div>
        <div className="grid grid-cols-[3fr_1fr] border-b border-gray-400 font-black">
          <div className="p-2 border-r border-gray-400 text-right">Total</div>
          <div className="p-2 text-right"><Price amount={invoice.totalAmount} showDecimals /></div>
        </div>
        <div className="p-3 space-y-1">
          <p className="font-bold" data-testid="exempt-note">Exempt health care service. No GST is charged.</p>
          <p className="text-gray-600">{invoice.amountInWords}</p>
        </div>
      </div>
    </Card>
  );
}
