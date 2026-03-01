
'use client';

import { AppointmentsTable } from "@/components/admin/AppointmentsTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { Button } from "@/components/ui/button";
import { FileDown, Printer } from "lucide-react";
import { useMemo, useState } from "react";

export default function TherapistBookingsPage() {
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const filters = useMemo(() => ({
    // This could be expanded to change based on activeFilter state
    status: activeFilter,
  }), [activeFilter]);

  return (
     <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">All Bookings</h1>
          <p className="text-muted-foreground">View and manage all your patient appointments.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2"/> Print</Button>
           <Button><FileDown className="mr-2"/> Export CSV</Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant={activeFilter === 'upcoming' ? 'default' : 'outline'} onClick={() => setActiveFilter('upcoming')}>Upcoming</Button>
        <Button variant={activeFilter === 'past' ? 'default' : 'outline'} onClick={() => setActiveFilter('past')}>Past (90 days)</Button>
        <Button variant={activeFilter === 'action' ? 'default' : 'outline'} onClick={() => setActiveFilter('action')}>Needs Action</Button>
      </div>

      <FilterBar
        showDatePicker={true}
        showLocationFilters={true}
        showSearch={true}
        showTherapyFilters={true}
      />
      
      <AppointmentsTable scope="therapist" filters={filters} />
    </div>
  );
}
