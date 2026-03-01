
'use client';

import { AppointmentsTable } from "@/components/admin/AppointmentsTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { Button } from "@/components/ui/button";
import { listAppointments } from "@/lib/repos/appointments";
import { downloadCsv, getSafeDate } from "@/lib/utils";
import { FileDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const dynamic = 'force-dynamic';

export default function AdminAppointmentsPage() {
  const [filters, setFilters] = useState({});
  const { toast } = useToast();

  const handleExport = async () => {
    toast({ title: "Exporting...", description: "Fetching all appointment data..." });
    const allAppointments = await listAppointments(); // Fetch all, ignoring filters for a full export

    const headers = [
      "ID", "Date", "Time", "Therapist Name", "Therapist ID", "Patient Name", "Patient ID",
      "Service Type", "Mode", "Status", "Payment Status", "PCR Status",
      "Verification Status", "Service Amount", "Total Amount", "Cancellation Reason",
      "Notes", "Address Line 1", "Address City", "Address State", "Address Pin",
      "Created At",
    ];

    const data = allAppointments.map(appt => [
        appt.id,
        getSafeDate(appt.date)?.toLocaleDateString() || '',
        appt.time,
        appt.therapist,
        appt.therapistId,
        appt.patientName,
        appt.patientId,
        appt.therapyType,
        appt.mode,
        appt.status,
        appt.paymentStatus,
        appt.pcrStatus,
        appt.verificationStatus,
        appt.serviceAmount || 0,
        appt.totalAmount || 0,
        appt.cancellationReason || '',
        appt.notes || '',
        appt.serviceAddress?.line1 || '',
        appt.serviceAddress?.city || '',
        appt.serviceAddress?.state || '',
        appt.serviceAddress?.pin || '',
        getSafeDate(appt.createdAt)?.toISOString() || ''
    ]);

    downloadCsv(headers, data, 'all-appointments-export.csv');
    toast({ title: "Export Complete", description: `${allAppointments.length} appointments exported.` });
  };


  return (
     <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">All Appointments</h1>
            <p className="text-muted-foreground">Manage all user appointments across the platform.</p>
        </div>
        <Button onClick={handleExport}><FileDown className="mr-2"/>Export All</Button>
      </div>
      <FilterBar
        showDatePicker={true}
        showLocationFilters={false} // Location search is part of general search for now
        showSearch={true}
        showTherapyFilters={true}
        showAppointmentFilters={true} // Enable new filters
        onFilterChange={setFilters}
      />
      <AppointmentsTable scope="admin" filters={filters} />
    </div>
  );
}
