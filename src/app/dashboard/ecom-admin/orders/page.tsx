
'use client';

import { OrdersTable } from "@/components/admin/OrdersTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export default function EcomAdminOrdersPage() {
  const [filters, setFilters] = useState({});
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Manage Orders</h1>
            <p className="text-muted-foreground">View and manage all customer product orders.</p>
        </div>
        <Button disabled><FileDown className="mr-2"/>Export</Button>
      </div>

       <FilterBar
            showDatePicker={true}
            showLocationFilters={true}
            showSearch={true}
            showEcomFilters={true}
            onFilterChange={setFilters}
        />
        
      <OrdersTable scope="ecom-admin" filters={filters} />
    </div>
  );
}
