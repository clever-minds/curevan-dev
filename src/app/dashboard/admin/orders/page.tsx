
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { useState } from "react";

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState({});

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Manage Orders</h1>
        <p className="text-muted-foreground">View and manage all customer product orders.</p>
      </div>
      
       <FilterBar
            showDatePicker={true}
            showLocationFilters={true}
            showSearch={true}
            showEcomFilters={true}
            onFilterChange={setFilters}
        />
        
      <OrdersTable scope="admin" filters={filters} />
    </div>
  );
}
