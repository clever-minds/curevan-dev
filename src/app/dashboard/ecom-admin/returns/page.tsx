

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FilterBar } from "@/components/admin/FilterBar";
import { ReturnsTable } from "@/components/admin/ReturnsTable";
import { useState } from "react";

export const dynamic = 'force-dynamic';

export default function EcomAdminReturnsPage() {
  const [filters, setFilters] = useState({});
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Manage Returns</h1>
        <p className="text-muted-foreground">Review and process customer return requests.</p>
      </div>

      <FilterBar
        showDatePicker={true}
        showLocationFilters={true}
        showSearch={true}
        showEcomFilters={true}
        onFilterChange={setFilters}
      />

       <ReturnsTable scope="ecom-admin" filters={filters} />
    </div>
  );
}
