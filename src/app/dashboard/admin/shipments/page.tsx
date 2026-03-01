

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FilterBar } from "@/components/admin/FilterBar";
import { ShipmentsTable } from "@/components/admin/ShipmentsTable";
import { useState } from "react";

export const dynamic = 'force-dynamic';

export default function AdminShipmentsPage() {
  const [filters, setFilters] = useState({});
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Manage Shipments</h1>
        <p className="text-muted-foreground">Oversee order fulfillment and tracking for the entire platform.</p>
      </div>

       <FilterBar
            showDatePicker={true}
            showLocationFilters={true}
            showSearch={true}
            showEcomFilters={true}
            onFilterChange={setFilters}
        />

       <ShipmentsTable scope="admin" filters={filters} />
    </div>
  );
}
