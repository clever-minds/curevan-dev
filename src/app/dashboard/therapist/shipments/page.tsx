

'use client';

import { ShipmentsTable } from "@/components/admin/ShipmentsTable";
import { FilterBar } from "@/components/admin/FilterBar";

export const dynamic = 'force-dynamic';

export default function TherapistShipmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">My Shipments</h1>
        <p className="text-muted-foreground">Track your own product orders and orders made using your referral code.</p>
      </div>

       <FilterBar 
            showSearch={true} 
            showDatePicker={true} 
            showEcomFilters={true}
            showLocationFilters={true}
        />
       
       <ShipmentsTable scope="therapist" />
    </div>
  );
}
