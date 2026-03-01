
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlayCircle, FileText, Phone, MapPin, Video, User, Star, Ban, MessageSquareWarning } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/lib/types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '../ui/skeleton';
import { listAppointments, listAppointmentsForUser ,cancelAppointments} from '@/lib/repos/appointments';

interface AppointmentsTableProps {
  scope: 'admin' | 'therapyAdmin' | 'therapist' | 'patient';
  filters?: any;
  context?: 'bookings' | 'pcr';
}

const getStatusBadgeVariant = (status: Appointment['status']) => {
  switch (status) {
    case 'Confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    case 'No-Show': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default: return 'secondary';
  }
}

const getPcrBadgeVariant = (status: Appointment['pcrStatus']) => {
  switch (status) {
    case 'locked': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case 'Draft':
    case 'submitted':
    case 'returned':
    case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    default: return 'secondary';
  }
}

const getPaymentBadgeVariant = (status: Appointment['paymentStatus']) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'Refunded': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default: return 'secondary';
    }
}

const ActionsMenu = ({ appointment, scope, context, asSheetItems = false }: { appointment: Appointment, scope: AppointmentsTableProps['scope'], context: AppointmentsTableProps['context'], asSheetItems?: boolean }) => {
  const { toast } = useToast();
  const isAdmin = scope === 'admin' || scope === 'therapyAdmin';
  const isTherapist = scope === 'therapist';
  const isPatient = scope === 'patient';
  const [loading, setLoading] = React.useState(false);

  const handleRequestUnlock = () => {
      // Here you would call a server action to create a PcrAmendmentRequest
      console.log(`Requesting unlock for PCR of booking: ${appointment.id}`);
      toast({
          title: "Unlock Request Sent",
          description: "Your request to unlock this PCR has been sent to the admin team for review.",
      });
  }
   const handleCancelAppointment = async () => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

        try {
          setLoading(true);
          // Call repo function
          await cancelAppointments(appointment.id);
          toast({
            title: "Appointment Cancelled",
            description: `Appointment #${appointment.id} has been cancelled.`,
          });
          if (oncancel) cancelAppointments(appointment.id);
        } catch (error) {
          console.error(error);
          toast({
            title: "Error",
            description: "Failed to cancel the appointment.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
  
  const content = (
    <>
        <DropdownMenuItem asChild><Link href={`/dashboard/invoices?id=INV-${appointment.id}`} className="w-full flex items-center"><FileText className="mr-2"/>View Invoice</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href={`/pcr/${appointment.id}`} className="w-full flex items-center"><FileText className="mr-2" />View PCR</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href={`/dashboard/admin/users?search=${appointment.patientId}`} className="w-full flex items-center"><User className="mr-2"/>View Patient</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href={`/therapists/${appointment.therapist.toLowerCase().replace(/ /g, '-')}`} className="w-full flex items-center"><User className="mr-2"/>View Therapist</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive"><Ban className="mr-2" /> Cancel</DropdownMenuItem>
    </>
  );

  if (asSheetItems) {
    return (
      <Sheet>
        <SheetTrigger asChild>
           <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Booking #{appointment.id}</SheetTitle>
            <SheetDescription>Select an action to perform for this booking.</SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-2">
             <Button variant="outline" className="w-full justify-start" asChild><Link href={`/pcr/${appointment.id}`}><FileText className="mr-2" /> Open PCR</Link></Button>
             <Button variant="outline" className="w-full justify-start" asChild><Link href={`/dashboard/invoices?id=INV-${appointment.id}`}><FileText className="mr-2"/>View Invoice</Link></Button>
             <Button variant="destructive" className="w-full justify-start"><Ban className="mr-2" /> Cancel</Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{content}</DropdownMenuContent>
    </DropdownMenu>
  );
};


const AppointmentCard = ({ appointment, scope, context }: { appointment: Appointment, scope: AppointmentsTableProps['scope'], context: AppointmentsTableProps['context'] }) => (
    <Card>
        <CardContent className="p-4">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold">{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</p>
                    <p className="text-sm text-muted-foreground">{scope === 'patient' ? appointment.therapist : appointment.patientName}</p>
                </div>
                {context === 'bookings' && <Badge className={cn(getStatusBadgeVariant(appointment.status))} variant="secondary">{appointment.status}</Badge>}
                {context === 'pcr' && <Badge className={cn(getPcrBadgeVariant(appointment.pcrStatus))} variant="secondary">{appointment.pcrStatus}</Badge>}
            </div>
            <div className="mt-4 space-y-1 text-sm">
                <p><strong>Service:</strong> {appointment.therapyType}</p>
                <p><strong>Mode:</strong> {appointment.mode}</p>
                 {appointment.mode === 'home' && appointment.serviceAddress && (
                    <p className="text-xs text-muted-foreground">
                        <strong>Location:</strong> {appointment.serviceAddress.line1}, {appointment.serviceAddress.city}
                    </p>
                )}
                <p><strong>Payment:</strong> <Badge variant="outline">{appointment.paymentStatus}</Badge></p>
                {context === 'bookings' && <p><strong>PCR:</strong> <Badge variant="outline">{appointment.pcrStatus}</Badge></p>}
            </div>
            <div className="mt-4 flex justify-end">
                <ActionsMenu appointment={appointment} scope={scope} context={context} asSheetItems />
            </div>
        </CardContent>
    </Card>
);

export function AppointmentsTable({ scope, filters = {}, context = 'bookings' }: AppointmentsTableProps) {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
const stableFilters = React.useMemo(() => filters, [JSON.stringify(filters)]);

React.useEffect(() => {
  async function fetchData() {
      setLoading(true);
      let data: Appointment[] = [];
      if (scope === 'patient' && user) {
        data = await listAppointmentsForUser(user.id, 'patient');
      } else if (scope === 'therapist' && user) {
        data = await listAppointmentsForUser(user.id, 'therapist');
      } else if (scope === 'admin' || scope === 'therapyAdmin') {
        data = await listAppointments(stableFilters);
      }

      console.log("scope value",scope)
      setAppointments(data);
      setLoading(false);
  }
  fetchData();
}, [scope, stableFilters, user?.id]);

  if (loading) {
      const rows = isMobile ? 3 : 10;
      return (
          <div className="space-y-3">
              {[...Array(rows)].map((_, i) => <Skeleton key={i} className={cn("w-full", isMobile ? 'h-48' : 'h-12')} />)}
          </div>
      )
  }

  if (isMobile) {
      return (
          <div className="space-y-3">
              {appointments.map(appointment => <AppointmentCard key={appointment.id} appointment={appointment} scope={scope} context={context} />)}
          </div>
      )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>{scope === 'patient' ? 'Therapist' : 'Patient'}</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>PCR</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</TableCell>
                  <TableCell>{scope === 'patient' ? appointment.therapist : appointment.patientName}</TableCell>
                  <TableCell>{appointment.therapyType}</TableCell>
                  <TableCell>{appointment.serviceAddress ? `${appointment.serviceAddress.city}` : 'N/A'}</TableCell>
                  <TableCell><Badge variant="outline">{appointment.mode}</Badge></TableCell>
                  <TableCell><Badge className={cn(getStatusBadgeVariant(appointment.status))} variant="secondary">{appointment.status}</Badge></TableCell>
                  <TableCell><Badge className={cn(getPaymentBadgeVariant(appointment.paymentStatus))} variant="secondary">{appointment.paymentStatus}</Badge></TableCell>
                  <TableCell><Badge className={cn(getPcrBadgeVariant(appointment.pcrStatus))} variant="secondary">{appointment.pcrStatus}</Badge></TableCell>
                  <TableCell className="text-right">
                    <ActionsMenu appointment={appointment} scope={scope} context={context} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
