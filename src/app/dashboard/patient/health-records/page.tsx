'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, FileText, Printer, MessageSquareWarning } from 'lucide-react';
import Link from 'next/link';
import { FilterBar } from '@/components/admin/FilterBar';
import type { Appointment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { listAppointmentsForUser } from '@/lib/repos/appointments';

export const dynamic = 'force-dynamic';

export default function PatientRecordsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({});
  const [lockedPcrs, setLockedPcrs] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
        if (!user) return;
        setLoading(true);
        const allAppointments = await listAppointmentsForUser(user.id, 'patient');
        console.log("All Appointments:...", allAppointments);
        setLockedPcrs(allAppointments.filter(a => a.pcrStatus === 'locked'));
        setLoading(false);
    };
    fetchRecords();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Health Records</h1>
        <p className="text-muted-foreground">View your finalized session reports (PCRs), lab reports, and export your treatment history.</p>
      </div>

      <FilterBar showDatePicker showSearch showTherapyFilters />

      <Card>
        <CardHeader>
          <CardTitle>Locked Patient Care Reports</CardTitle>
          <CardDescription>A read-only history of your completed and finalized sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session Date</TableHead>
                <TableHead>Therapist</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Booking ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={5}>
                        <Skeleton className="h-20 w-full" />
                    </TableCell>
                </TableRow>
              ) : lockedPcrs.length > 0 ? lockedPcrs.map(pcr => (
                <TableRow key={pcr.id}>
                  <TableCell>{new Date(pcr.date).toLocaleDateString()}</TableCell>
                  <TableCell>{pcr.therapist}</TableCell>
                  <TableCell>{pcr.therapyType}</TableCell>
                  <TableCell className="font-mono">{pcr.id}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/pcr/${pcr.id}`}><FileText className="mr-2"/>View PCR</Link>
                    </Button>
                     <Button variant="ghost" size="sm">
                      <MessageSquareWarning className="mr-2"/>Request Correction
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                    You have no locked health records yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
