
'use client';

import { AppointmentsTable } from "@/components/admin/AppointmentsTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { Button } from "@/components/ui/button";
import { downloadCsv, getSafeDate } from "@/lib/utils";
import type { Appointment } from "@/lib/types";
import { listAppointments } from "@/lib/repos/appointments";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { FileDown, Printer } from "lucide-react";

export default function AdminPcrPage() {
  const [filters, setFilters] = useState({});
  const { toast } = useToast();
  
  const handleExport = async () => {
    toast({ title: "Exporting...", description: "Fetching all appointment data for PCRs..." });

    // In a real-world scenario, you might want a specific function to fetch PCR-related data
    const allAppointments = await listAppointments();

    const headers = [
      "Booking ID", "Date", "Time", "Patient Name", "Therapist Name", "Service", "Mode",
      "Booking Status", "Payment Status", "PCR Status", "Verification Status"
    ];

    const data = allAppointments.map(appt => [
        appt.id,
        getSafeDate(appt.date)?.toLocaleDateString() || '',
        appt.time,
        appt.patientName,
        appt.therapist,
        appt.therapyType,
        appt.mode,
        appt.status,
        appt.paymentStatus,
        appt.pcrStatus,
        appt.verificationStatus,
    ]);

    downloadCsv(headers, data, `all-pcr-report.csv`);
    toast({ title: "Export Complete", description: `${allAppointments.length} records exported.` });
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Patient Care Reports (PCRs)</h1>
          <p className="text-muted-foreground">View, manage, and audit all PCRs across the platform.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2"/> Print View</Button>
           <Button onClick={handleExport}><FileDown className="mr-2"/> Export All</Button>
        </div>
      </div>
      <FilterBar
        showDatePicker={true}
        showLocationFilters={true}
        showSearch={true}
        showTherapyFilters={true}
        showAppointmentFilters={true} // This includes Status, Payment, PCR status etc.
        onFilterChange={setFilters}
      />
      <AppointmentsTable scope="admin" context="pcr" filters={filters} />
    </div>
  );
}
