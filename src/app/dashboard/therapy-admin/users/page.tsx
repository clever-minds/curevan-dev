'use client';

import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { useState } from "react";

export default function TherapyAdminUsersPage() {
  const [filters, setFilters] = useState({});
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Manage Users (Therapy)</h1>
        <p className="text-muted-foreground">View and manage all therapists and patients.</p>
      </div>
      <FilterBar
        showDatePicker={true}
        showLocationFilters={true}
        showSearch={true}
        showTherapyFilters={true}
        showAdminUserFilters={true}
        onFilterChange={setFilters}
      />
      <AdminUsersTable scope="therapyAdmin" filters={filters} />
    </div>
  );
}
