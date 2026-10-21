
'use client';

import { AppointmentsTable } from "@/components/admin/AppointmentsTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { Button } from "@/components/ui/button";
import { downloadCsv, getSafeDate } from "@/lib/utils";
import type { Appointment } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { listAppointmentsForUser } from "@/lib/repos/appointments";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { FileDown, Printer } from "lucide-react";

export default function TherapistPcrPage() {
  const [filters, setFilters] = useState({});
  const { user } = useAuth();
  const { toast } = useToast();
  
  const handleExport = async () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to export data.",
        });
        return;
    }

    toast({ title: "Exporting...", description: "Fetching your appointment data..." });

    const allAppointments = await listAppointmentsForUser(user.id, 'therapist');

    const headers = [
      "Booking ID", "Date", "Time", "Patient Name", "Service", "Mode",
      "Booking Status", "Payment Status", "PCR Status", "Verification Status"
    ];

    const data = allAppointments.map(appt => {
        const rawDate = appt.date as unknown as string;
      let displayDate: string = rawDate;
        if (rawDate && rawDate.length >= 10 && rawDate.includes('-')) {
            const parts = rawDate.substring(0, 10).split('-');
            if (parts.length === 3) {
                const [y, m, d] = parts.map(Number);
                const localDate = new Date(y, m - 1, d);
                if (!isNaN(localDate.getTime())) {
                    displayDate = format(localDate, 'MM/dd/yyyy');
                }
            }
        } else {
            try {
                displayDate = rawDate ? format(parseISO(rawDate), 'MM/dd/yyyy') : 'N/A';
            } catch (e) {
                displayDate = rawDate || 'N/A';
            }
        }

        return [
            appt.id,
            displayDate,
            appt.time,
            appt.patientName,
            appt.therapyType,
            appt.mode,
            appt.status,
            appt.paymentStatus,
            appt.pcrStatus,
            appt.verificationStatus,
        ];
    });

    downloadCsv(headers, data, `pcr-report-${user.uid}.csv`);
    toast({ title: "Export Complete", description: `${allAppointments.length} records exported.` });
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Patient Care Reports (PCRs)</h1>
          <p className="text-muted-foreground">View and complete PCRs for your past sessions. Locking a PCR is required to process your earnings for the session.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2"/> Print</Button>
           <Button onClick={handleExport}><FileDown className="mr-2"/> Export CSV</Button>
        </div>
      </div>
      <FilterBar
        showDatePicker={true}
        showSearch={true}
        showTherapyFilters={true}
        onFilterChange={setFilters}
      />
      <AppointmentsTable scope="therapist" context="pcr" filters={filters} />
    </div>
  );
}
