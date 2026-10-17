import React from 'react';

type Supplier = {
  legalName: string; tradeName?: string; gstin?: string; cin?: string; pan?: string; phone?: string; email?: string;
  address: { line1?: string; city?: string; state?: string; pin?: string };
};

/** "+91" once: whatever the stored number starts with (+91, 91, 0) is dropped first. */
export const formatIndianPhone = (raw?: string) => {
  const digits = String(raw ?? '').replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
  return digits ? `+91 ${digits}` : '';
};

/** The supplier lines of an invoice, from the company settings. GSTIN, CIN and PAN are printed only when they are set. */
export function SupplierDetails({ supplier }: { supplier: Supplier }) {
  const a = supplier.address || {};
  const place = [a.city, a.state].filter(Boolean).join(', ');
  return (
    <div className="space-y-0.5 text-[10px]">
      {a.line1 && <p>{a.line1}</p>}
      {(place || a.pin) && <p>{place}{a.pin ? ` - ${a.pin}` : ''}, India</p>}
      {supplier.gstin && <p className="font-semibold">GSTIN {supplier.gstin}</p>}
      {supplier.cin && <p>CIN {supplier.cin}</p>}
      {supplier.pan && <p>PAN {supplier.pan}</p>}
      {supplier.email && <p>{supplier.email}</p>}
      {supplier.phone && <p>{formatIndianPhone(supplier.phone)}</p>}
    </div>
  );
}

/** Visible on screen and in print while the company has no GSTIN in its settings. */
export function GstinWarning({ supplier }: { supplier: Supplier }) {
  if (supplier.gstin) return null;
  return (
    <div role="alert" className="m-4 border-2 border-red-600 bg-red-50 p-2 text-center text-[11px] font-bold text-red-700 print:m-0">
      The supplier GSTIN is not set in the company settings. This invoice is not valid for GST purposes until it is added.
    </div>
  );
}
