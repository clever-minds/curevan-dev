'use client';

import { ReferralCard } from '@/components/affiliate/ReferralCard';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PlayCircle, Clock, FilePlus, TrendingUp, Users, Percent, Wallet, Star, FileDown, Edit, GitBranch, AlertCircle, CheckCircle, Hourglass, ArrowRight } from "lucide-react";
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
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Price } from "@/components/money/price";
import { listAppointmentsForUser, updateAppointmentStatus, transitionAppointment } from "@/lib/repos/appointments";
import { getTherapistById } from "@/lib/repos/therapists";
import { getTherapyCategories } from "@/lib/repos/meta";
import { isFinished } from '@/lib/appointment-status';
import { getTherapistDashboardStats } from "@/lib/repos/therapyAdmin";
import { MyPatientsProgress } from "@/components/therapist/MyPatientsProgress";

export const dynamic = 'force-dynamic';

const DashboardSection = ({ id, title, children, className }: { id: string, title: string, children: React.ReactNode, className?: string }) => (
    <section id={id} className={cn("scroll-mt-24 space-y-4 avoid-break", className)}>
        <h2 className="text-2xl font-bold font-headline">{title}</h2>
        {children}
    </section>
);

const KpiCard = ({ title, value, icon: Icon, description, isCurrency = false }: { title: string, value: string | number, icon: React.ElementType, description?: string, isCurrency?: boolean }) => (
    <Card className="avoid-break">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{isCurrency && typeof value === 'number' ? <Price amount={value} /> : value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
)

export default function TherapistDashboard() {
  const [activeSession, setActiveSession] = useState<Appointment | null>(null);
  const [verifyingAppointment, setVerifyingAppointment] = useState<Appointment | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [topServicesData, setTopServicesData] = useState<any[]>([]);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const earningsHistory = earningsData?.earningsHistory || [];
  const excludedItems = earningsHistory.filter((e: any) => e.status === 'On-Hold');

  useEffect(() => {
    if (user && user.role !== 'therapist') {
      router.push('/dashboard/account');
    }
  }, [user, router]);

  useEffect(() => {
    async function fetchData() {
        if (!user) return;
        setLoading(true);
        try {
            const results = await Promise.all([
                listAppointmentsForUser(user.id, 'therapist'),
                getTherapistById(user.id),
                getTherapyCategories(),
                import("@/services/earnings-service").then(m => m.fetchEarningsData(user.id)),
                getTherapistDashboardStats(user.id)
            ]);
            setAppointments(results[0]);
            setTherapist(results[1]);
            setEarningsData(results[3]);
            setStats(results[4]);
            
            const fetchedCats = results[2] || [];
            if (results[4]?.charts?.topServicesData?.length) {
              setTopServicesData(results[4].charts.topServicesData);
            } else {
              setTopServicesData(fetchedCats.slice(0,3).map((cat: string) => ({
                  name: cat.split(" ")[0],
                  count: 0,
              })));
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to load dashboard data.",
            });
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [user, toast]);


  const handleStartSessionRequest = (appointment: Appointment) => {
    // This simulates the "Verify patient (OTP/QR/GEOFENCE)" step (B2 in DFD)
    setVerifyingAppointment(appointment);
  };
  
  // statuses in which the therapist is in the middle of a visit (restored after a page reload)
  const JOURNEY_STATUSES = ['therapist_on_the_way', 'arrived', 'in_progress', 'pcr_pending'];
  useEffect(() => {
    if (activeSession) return;
    const live = appointments.find((a) => JOURNEY_STATUSES.includes(a.status));
    if (live) setActiveSession(live);
  }, [appointments, activeSession]);

  // the list buttons open the visit card; every real step is then checked by the server
  const handleOpenJourney = (appointment: Appointment) => {
    setActiveSession(appointment);
  };

  // the server has already moved the booking to in_progress when this runs
  const handleVerificationSuccess = (appointment: Appointment) => {
    setActiveSession(appointment);
    setVerifyingAppointment(null);
    setAppointments((prev) => prev.map((a) => (a.id === appointment.id ? { ...a, status: appointment.status, sessionStartedAt: appointment.sessionStartedAt } : a)));
  };

  const handleStatusUpdate = async (appointmentId: number, newStatus: Appointment['status']) => {
    const result = await transitionAppointment(appointmentId, newStatus);
    if (result.success) {
      const stamp = new Date().toISOString();
      setActiveSession((prev) => (prev && prev.id === appointmentId ? { ...prev, status: newStatus } : prev));
      setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus, travelStartedAt: newStatus === 'therapist_on_the_way' ? stamp : a.travelStartedAt, arrivedAt: newStatus === 'arrived' ? stamp : a.arrivedAt } : a)));
    }
    return result;
  };

  const handleEndSession = () => {
    // the session is over; the PCR submission is what completes the booking
    router.push(`/pcr/${activeSession?.id}`);
  };

  
  if (loading || !user || user.role !== 'therapist') {
    return <Skeleton className="w-full h-screen" />;
  }

  return (
     <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 no-print">
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-headline">My Dashboard</h1>
              <p className="text-muted-foreground">An overview of your activity and earnings.</p>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => window.print()}><FileDown className="mr-2"/> Print / Download Report</Button>
            </div>
          </div>
          
        <div id="report" className="print-area space-y-12">
            <div className="print-only hidden text-center mb-8">
                <h1 className="text-3xl font-bold">Therapist Activity Report</h1>
                <p className="text-muted-foreground">For period: Jan 1, 2024 - Jul 31, 2024</p>
            </div>

            <div className="flex flex-wrap gap-4">
               <Button asChild variant="outline" className="w-full sm:w-auto">
                 <Link href="/dashboard/account">Working Hours</Link>
               </Button>
               <Button asChild variant="outline" className="w-full sm:w-auto">
                 <Link href="/dashboard/therapist/leaves">Manage Leaves</Link>
               </Button>
               <Button asChild variant="outline" className="w-full sm:w-auto">
                 <Link href="/dashboard/therapist/edit">Edit Profile & Documents</Link>
               </Button>
               <Button asChild variant="outline" className="w-full sm:w-auto">
                 <Link href="/dashboard/support">Contact Support</Link>
               </Button>
               <Button asChild variant="outline" className="w-full sm:w-auto">
                 <Link href="/dashboard/therapist/reviews">My Ratings & Reviews</Link>
               </Button>
             </div>

            {activeSession && (
                <ActiveSessionCard 
                    session={activeSession} 
                    onEndSession={handleEndSession} 
                    onStatusUpdate={handleStatusUpdate}
                    onVerifyRequest={(session) => setVerifyingAppointment(session)}
                />
            )}

            {/* My Patients Recovery & Treatment Plans */}
            <MyPatientsProgress />

            {/* KPIs */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Sessions Completed (90d)" value={stats?.kpis?.sessionsCompleted ?? 0} icon={TrendingUp} isCurrency={false} />
                <KpiCard title="PCR Lock Rate (90d)" value={`${stats?.kpis?.pcrLockRate ?? 0}%`} icon={Percent} />
                <KpiCard title="Net Payout (90d)" value={stats?.kpis?.netPayout ?? 0} icon={Wallet} isCurrency={true} />
                <KpiCard title="Product Commissions (90d)" value={stats?.kpis?.productCommissions ?? 0} icon={Wallet} isCurrency={true} />
                <KpiCard title="Unique Patients (90d)" value={stats?.kpis?.uniquePatients ?? 0} icon={Users} isCurrency={false} />
                <KpiCard title="Avg. Rating (90d)" value={stats?.kpis?.avgRating ?? "0.0"} icon={Star} />
            </div>

            <DashboardSection id="charts" title="Insights (Last 90 Days)">
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardCard title="Sessions Per Day" type="line" data={stats?.charts?.sessionData || []} categoryKey="date" valueKey="sessionCount" isCurrency={false} />
                    <DashboardCard title="Session Mode Split" type="pie" data={stats?.charts?.modeSplitData || []} categoryKey="name" valueKey="value" isCurrency={false} />
                    <DashboardCard title="Weekly Earnings (Net)" type="bar" data={stats?.charts?.weeklyEarningsData || []} categoryKey="week" valueKey="Service" className="lg:col-span-2" isCurrency={true} />
                    <DashboardCard title="Top Services by Count" type="bar" data={topServicesData} categoryKey="name" valueKey="count" className="lg:col-span-2" isCurrency={false} />
                </div>
            </DashboardSection>

             <DashboardSection id="schedule" title="Upcoming Schedule">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Next 5 Appointments</CardTitle>
                             <Button asChild variant="secondary" size="sm">
                                <Link href="/dashboard/therapist/schedule">
                                    Go to Today's Schedule <ArrowRight className="ml-2"/>
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Service</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appointments.filter(a => new Date(a.date) > new Date()).slice(0, 5).map((appointment) => (
                            <TableRow key={appointment.id}>
                                <TableCell>{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</TableCell>
                                <TableCell>{appointment.patientName}</TableCell>
                                <TableCell>{appointment.therapyType}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </DashboardSection>

             <DashboardSection id="earnings-review" title="Payout Items (Last 90 Days)">
                <Card>
                    <CardHeader>
                        <CardTitle>Earnings Ledger</CardTitle>
                        <CardDescription>A detailed breakdown of your recent earnings activity.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Source ID</TableHead>
                            <TableHead>Net</TableHead>
                            <TableHead>State</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {earningsHistory.map((item: any) => (
                            <TableRow key={item.source}>
                                <TableCell>{new Date(item.sessionDate).toLocaleDateString()}</TableCell>
                                <TableCell><Badge variant={item.type === 'service' ? 'default' : 'secondary'}>{item.type}</Badge></TableCell>
                                <TableCell>{item.source}</TableCell>
                                <TableCell><Price amount={item.netAmount} showDecimals /></TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn(
                                        item.status === "Paid" && "border-green-500 text-green-700",
                                        item.status === "On-Hold" && "border-yellow-500 text-yellow-700",
                                        item.status === "Payout Scheduled" && "border-blue-500 text-blue-700"
                                    )}>
                                        {item.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </DashboardSection>

             <DashboardSection id="payout-exclusions" title="Items Excluded From Payout">
                <Card>
                    <CardHeader>
                        <CardTitle>On-Hold Items</CardTitle>
                        <CardDescription>These items require action before they can be included in a payout.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {excludedItems.length > 0 ? (
                            <div className="space-y-3">
                            {excludedItems.map((item: any) => (
                                <div key={item.source} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Hourglass className="text-yellow-600"/>
                                        <div>
                                            <p className="font-semibold">Booking ID: {item.source}</p>
                                            <p className="text-sm text-muted-foreground">Reason: {item.reason}</p>
                                        </div>
                                    </div>
                                    <Button asChild variant="secondary" size="sm">
                                        <Link href={`/pcr/${item.source.replace('BK-','')}`}>Resolve</Link>
                                    </Button>
                                </div>
                            ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <CheckCircle className="mx-auto w-12 h-12 text-green-500 mb-2"/>
                                <p>No items are currently on hold. Great job!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </DashboardSection>

            <DashboardSection id="referral" title="Referral Program">
                 <ReferralCard />
            </DashboardSection>

        </div>
      
      <OtpDialog 
        appointment={verifyingAppointment}
        onClose={() => setVerifyingAppointment(null)}
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
}
