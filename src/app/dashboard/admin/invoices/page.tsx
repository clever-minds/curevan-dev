
'use client';

import { InvoicesTable } from "@/components/admin/InvoicesTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { useState } from "react";

export default function AdminInvoicesPage() {
  const [filters, setFilters] = useState({});
  return (
     <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">All Invoices</h1>
        <p className="text-muted-foreground">Manage all goods and service invoices across the platform.</p>
      </div>
      <FilterBar
        showDatePicker={true}
        showSearch={true}
        showTherapyFilters={true}
        showEcomFilters={true}
        onFilterChange={setFilters}
      />
      <InvoicesTable scope="admin" filters={filters} />
    </div>
  );
}
