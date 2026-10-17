
'use client';

import { AppointmentsTable } from "@/components/admin/AppointmentsTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { Button } from "@/components/ui/button";
import { FileDown, Printer } from "lucide-react";
import { useState, useEffect } from "react";
import type { Appointment } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { listAppointmentsForUser } from "@/lib/repos/appointments";
import { downloadCsv, getSafeDate } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { StartCodeCard } from "@/components/patient/start-code-card";
import { ConfirmNextSessionCard } from "@/components/patient/ConfirmNextSessionCard";
import { UPCOMING_STATUSES } from "@/lib/appointment-status";


export default function PatientBookingsPage() {
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
        const data = await listAppointmentsForUser(user.id, 'patient');
        setAppointments(data);
    };
    fetchData();
  }, [user]);
  
  const handleExport = () => {
    const reportHeaders = [
      "ID", "Date", "Time", "Therapist Name", "Therapist ID",
      "Service Type", "Mode", "Status", "Payment Status", "PCR Status",
      "Verification Status", "Service Amount", "Total Amount", "Cancellation Reason",
      "Notes", "Address Line 1", "Address Line 1", "City", "State", "PIN", "Country",
      "Created At",
    ];

    const reportData = appointments.map((appt) => {
      const rawDate = appt.date as unknown as string;
      let displayDate: string = rawDate;
      if (rawDate && rawDate.length >= 10 && rawDate.includes("-")) {
        const parts = rawDate.substring(0, 10).split("-");
        if (parts.length === 3) {
          const [y, m, d] = parts.map(Number);
          const localDate = new Date(y, m - 1, d);
          if (!isNaN(localDate.getTime())) {
            displayDate = format(localDate, "MM/dd/yyyy");
          }
        }
      } else {
        try {
          displayDate = rawDate ? format(parseISO(rawDate), "MM/dd/yyyy") : "N/A";
        } catch (e) {
          displayDate = rawDate || "N/A";
        }
      }

      return [
        appt.id,
        displayDate,
        appt.time,
        appt.therapist,
        appt.therapistId,
        appt.therapyType,
        appt.mode,
        appt.status,
        appt.paymentStatus,
        appt.pcrStatus,
        appt.verificationStatus,
        appt.serviceAmount || 0,
        appt.totalAmount || 0,
        appt.cancellationReason || "",
        appt.notes || "",
        appt.serviceAddress?.line1 || "",
        appt.serviceAddress?.line2 || "",
        appt.serviceAddress?.city || "",
        appt.serviceAddress?.state || "",
        appt.serviceAddress?.pin || "",
        appt.serviceAddress?.country || "",
        getSafeDate(appt.createdAt)?.toISOString() || "",
      ];
    });

    downloadCsv(reportHeaders, reportData, "my-bookings-report.csv");
  };

  return (
     <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">My Bookings</h1>
          <p className="text-muted-foreground">A list of your upcoming and past appointments.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2"/> Print</Button>
           <Button onClick={handleExport}><FileDown className="mr-2"/> Export CSV</Button>
        </div>
      </div>
       <div className="flex items-center gap-2">
        <Button variant={activeFilter === 'upcoming' ? 'default' : 'outline'} onClick={() => setActiveFilter('upcoming')}>Upcoming</Button>
        <Button variant={activeFilter === 'past' ? 'default' : 'outline'} onClick={() => setActiveFilter('past')}>Past (90 days)</Button>
        <Button variant={activeFilter === 'action' ? 'default' : 'outline'} onClick={() => setActiveFilter('action')}>Needs Action</Button>
      </div>
      <FilterBar
        showDatePicker={true}
        showSearch={true}
        showTherapyFilters={true}
      />
      <ConfirmNextSessionCard />
      {appointments.filter((a) => (UPCOMING_STATUSES as string[]).includes(a.status)).length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 no-print">
          {appointments.filter((a) => (UPCOMING_STATUSES as string[]).includes(a.status)).map((a) => (
            <StartCodeCard key={a.id} appointment={a} />
          ))}
        </div>
      )}
      <AppointmentsTable scope="patient" />
    </div>
  );
}
