'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlayCircle, FilePlus, Share2, Copy, Calendar as CalendarIcon, Phone, MapPin, ExternalLink, BookOpen, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useMemo } from "react";
import type { Appointment, Therapist } from "@/lib/types";
import { ActiveSessionCard } from "../active-session-card";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { OtpDialog } from "@/components/otp-dialog";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { isSameDay, addDays } from "date-fns";
import { listAppointmentsForUser } from "@/lib/repos/appointments";
import { getTherapistById } from "@/lib/repos/therapists";

export const dynamic = 'force-dynamic';

const GrowthCTA = ({title, description, button1Text, button1Href, button2Text, button2Href, icon: Icon}: any) => (
    <Card className="flex flex-col h-full">
        <CardHeader className="flex flex-row items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-full mt-1">
                <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="mt-auto flex flex-col sm:flex-row gap-2">
            <Button asChild className="flex-1">
                <Link href={button1Href}>{button1Text}</Link>
            </Button>
            <Button asChild variant="secondary" className="flex-1">
                <Link href={button2Href}>{button2Text}</Link>
            </Button>
        </CardContent>
    </Card>
);

export default function TherapistSchedulePage() {
  const [activeSession, setActiveSession] = useState<Appointment | null>(null);
  const [verifyingAppointment, setVerifyingAppointment] = useState<Appointment | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const appointmentsForDay = useMemo(() => {
    if (!user) return [];
    return allAppointments.filter(a => {
        const appointmentDate = new Date(a.date);
        return selectedDate && isSameDay(appointmentDate, selectedDate)
    });
  }, [selectedDate, user, allAppointments]);


  useEffect(() => {
    if (user && user.role !== 'therapist') {
      router.push('/dashboard/account');
    }
  }, [user, router]);
  
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
        setLoading(true);
        const [therapistData, appointmentData] = await Promise.all([
            getTherapistById(user.uid),
            listAppointmentsForUser(user.id, 'therapist')
        ]);
        setTherapist(therapistData);
        setAllAppointments(appointmentData);
        setLoading(false);
    }
    fetchData();
  }, [user]);
  
  const handleStartSessionRequest = (appointment: Appointment) => {
    setVerifyingAppointment(appointment);
  };
  
  const handleVerificationSuccess = (appointment: Appointment) => {
    setActiveSession(appointment);
    setVerifyingAppointment(null);
  }

  const handleEndSession = () => {
    toast({
        title: 'Session Complete',
        description: `You have successfully checked out from your session with ${activeSession?.patientName}. Please complete the PCR now.`,
    });
    router.push(`/pcr/${activeSession?.id}`);
    setActiveSession(null);
  };

  const handleCopyCode = () => {
    if (!therapist?.referralCode) return;
    navigator.clipboard.writeText(therapist.referralCode);
    toast({ title: "Code Copied!", description: `Your referral code ${therapist.referralCode} is ready to be shared.`})
  }

  if (loading || !user) {
      return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      )
  }

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Today's Schedule</h1>
        <p className="text-muted-foreground">Manage your daily appointments and find opportunities to grow.</p>
      </div>

       <div className="p-4 border rounded-lg bg-card flex flex-col md:flex-row gap-4 items-center">
         <div className="flex-1 flex gap-2">
            <Button variant={isSameDay(selectedDate || new Date(), new Date()) ? 'default' : 'outline'} onClick={() => setSelectedDate(new Date())}>Today</Button>
            <Button variant={isSameDay(selectedDate || new Date(), addDays(new Date(), 1)) ? 'default' : 'outline'} onClick={() => setSelectedDate(addDays(new Date(), 1))}>Tomorrow</Button>
         </div>
         <DatePicker date={selectedDate} setDate={setSelectedDate} />
      </div>

      {activeSession && (
          <div className="sticky top-[calc(var(--header-height)+1rem)] z-20">
              <ActiveSessionCard session={activeSession} onEndSession={handleEndSession} />
          </div>
      )}

      <Card>
        <CardHeader>
            <CardTitle>Appointments for {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardTitle>
        </CardHeader>
        <CardContent>
            {appointmentsForDay.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointmentsForDay.map((appt) => (
                            <TableRow key={appt.id}>
                                <TableCell>{appt.time}</TableCell>
                                <TableCell>{appt.patientName}</TableCell>
                                <TableCell>{appt.therapyType}</TableCell>
                                <TableCell><Badge variant="outline">{appt.mode}</Badge></TableCell>
                                <TableCell className="space-x-2">
                                     <Button variant="outline" size="sm" onClick={() => handleStartSessionRequest(appt)} disabled={!!activeSession}><PlayCircle className="mr-2"/>Start</Button>
                                     <Button variant="ghost" size="sm" asChild><Link href={`/pcr/${appt.id}`}><ExternalLink className="mr-2"/>PCR</Link></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No appointments scheduled for this day.</p>
                </div>
            )}
        </CardContent>
      </Card>
      
       <div className="grid md:grid-cols-2 gap-6 pt-8">
            <GrowthCTA 
                title="Write a Case Study" 
                description="Use free time to publish de-identified case insights or knowledge posts. More posts → higher visibility → more bookings."
                icon={BookOpen}
                button1Text="Write Post"
                button1Href="/dashboard/new-post"
                button2Text="View Writing Tips"
                button2Href="/dashboard/therapist/training"
            />
            <GrowthCTA 
                title="Earn with Your Referral Code" 
                description="Share your code: patients get 5% off, you earn 10% commission on every purchase. Simple, recurring income."
                icon={HandCoins}
                button1Text="Share Code"
                button1Href="#"
                button2Text="View Earnings"
                button2Href="/dashboard/earnings"
            />
       </div>

      <OtpDialog 
        appointment={verifyingAppointment}
        onClose={() => setVerifyingAppointment(null)}
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
}
