
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PlayCircle, Clock, FilePlus, Share2, TrendingUp, Users, Percent, Wallet, Star, FileDown, Edit, GitBranch, AlertCircle, CheckCircle, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useMemo } from "react";
import type { Appointment, Therapist } from "@/lib/types";
import { ActiveSessionCard } from "./active-session-card";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { OtpDialog } from "@/components/otp-dialog";
import { useToast } from "@/hooks/use-toast";
import { DashboardCard } from "@/components/ui/dashboard-card";
import ReportAiSummary from "@/components/report/report-ai-summary";
import { fetchEarningsData, EarningsData } from "@/services/earnings-service";
import { listAppointmentsForUser, getAvailableRequests, acceptBookingRequest, updateAppointmentStatus } from "@/lib/repos/appointments";
import { getTherapistById } from "@/lib/repos/therapists";
import { getTherapyCategories } from "@/lib/repos/meta";

export const dynamic = 'force-dynamic';




const DashboardSection = ({ id, title, children, className }: { id: string, title: string, children: React.ReactNode, className?: string }) => (
    <section id={id} className={cn("scroll-mt-24 space-y-4 avoid-break", className)}>
        <h2 className="text-2xl font-bold font-headline">{title}</h2>
        {children}
    </section>
);

const KpiCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => (
    <Card className="avoid-break">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
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
  const [availableRequests, setAvailableRequests] = useState<Appointment[]>([]);
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [topServicesData, setTopServicesData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);

  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  const excludedItems = earningsData?.earningsHistory?.filter((e: any) => e.status === 'On-Hold') || [];

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
                getAvailableRequests(user.id),
                getTherapistById(user.id),
                getTherapyCategories(),
                import('@/lib/repos/therapists').then(m => m.getTherapistDashboardStats(user.id)),
                import("@/services/earnings-service").then(m => m.fetchEarningsData(user.id))
            ]);
            setAppointments(results[0]);
            setAvailableRequests(results[1]);
            setTherapist(results[2]);
            setStats(results[4]);
            setEarningsData(results[5]);
            
            const fetchedCats = results[3] || [];
            setTopServicesData(fetchedCats.slice(0,3).map((cat: string) => ({
                name: cat.split(" ")[0],
                count: Math.floor(Math.random() * 20) + 5,
            })))
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
    // If the status is Pending or Assigned, the therapist can navigate/start
    setActiveSession(appointment);
  };
  
  const handleAcceptRequest = async (appointmentId: number) => {
    if (!user || !therapist) return;
    const success = await acceptBookingRequest(appointmentId, {
        therapistId: user.id,
        therapistName: therapist.name || user.name || "Unknown Therapist",
        therapistPhone: (user as any).phone || ""
    });
    if (success) {
        toast({ title: "Booking Accepted", description: "The appointment has been added to your schedule." });
        // Refresh data
        const [appointmentData, availableReqs] = await Promise.all([
            listAppointmentsForUser(user.id, 'therapist'),
            getAvailableRequests(user.id)
        ]);
        setAppointments(appointmentData);
        setAvailableRequests(availableReqs);
    } else {
        toast({ title: "Failed to accept booking", variant: "destructive" });
    }
  };

  const handleRejectRequest = (appointmentId: number) => {
      // Hide locally
      setAvailableRequests(prev => prev.filter(r => r.id !== appointmentId));
  };
  
  const handleVerificationSuccess = async (appointment: Appointment) => {
    // This simulates creating a `sessions` row and starting the timer (B3 in DFD)
    await updateAppointmentStatus(appointment.id, 'Session Started');
    setActiveSession({ ...appointment, status: 'Session Started' });
    setVerifyingAppointment(null);
  }

  const handleStatusUpdate = async (appointmentId: number, newStatus: Appointment['status']) => {
      const success = await updateAppointmentStatus(appointmentId, newStatus);
      if (success && activeSession && activeSession.id === appointmentId) {
          setActiveSession({ ...activeSession, status: newStatus });
      }
  };

  const handleEndSession = () => {
    // This simulates closing the session and preparing for PCR documentation (P3 in DFD)
    toast({
        title: 'Session Complete',
        description: `You have successfully checked out from your session with ${activeSession?.patientName}. Please complete the PCR now.`,
    });
    router.push(`/pcr/${activeSession?.id}`);
    setActiveSession(null);
  };

  const handleShareCode = () => {
    const shareUrl = `https://curevan.com/ecommerce?ref=${therapist?.referralCode}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "Your referral link is ready to be shared.",
    });
  };
  
  if (!user || user.role !== 'therapist' || loading) {
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
                 <Link href="/dashboard/therapist/availability">Manage Availability</Link>
               </Button>
               <Button asChild variant="outline" className="w-full sm:w-auto">
                 <Link href="/dashboard/therapist/edit">Edit Profile & Documents</Link>
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

            {/* KPIs */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Sessions Completed" value={stats?.kpis?.sessionsCompleted ?? 0} icon={TrendingUp} />
                <KpiCard title="PCR Lock Rate" value={`${stats?.kpis?.pcrLockRate ?? 0}%`} icon={Percent} />
                <KpiCard title="Net Payout (Estimated)" value={`₹${(stats?.kpis?.netPayout ?? 0).toLocaleString()}`} icon={Wallet} />
                <KpiCard title="Product Commissions" value={`₹${(stats?.kpis?.productCommissions ?? 0).toLocaleString()}`} icon={Wallet} />
                <KpiCard title="Unique Patients" value={stats?.kpis?.uniquePatients ?? 0} icon={Users} />
                <KpiCard title="Avg. Rating" value={stats?.kpis?.avgRating ?? "0.0"} icon={Star} />
            </div>

            <ReportAiSummary 
                summaryText={[
                    "Your session volume is highest on Fridays. Consider opening more slots.",
                    "You have 3 pending PCRs older than 48 hours. Locking these will unlock ₹4,500 in earnings for the next payout.",
                    "Your most frequent service is post-op knee rehab. A new training module on advanced techniques is available."
                ]}
                regenerate={() => console.log('regenerate')}
                copy={() => console.log('copy')}
            />

            <DashboardSection id="charts" title="Insights (Dynamic)">
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardCard title="Sessions Per Day" type="line" data={stats?.charts?.sessionData || []} categoryKey="date" valueKey="sessionCount" />
                    <DashboardCard title="Session Mode Split" type="pie" data={stats?.charts?.modeSplitData || []} categoryKey="name" valueKey="value" />
                    <DashboardCard title="Weekly Earnings (Net)" type="bar" data={stats?.charts?.weeklyEarningsData || []} categoryKey="week" valueKey="Service" className="lg:col-span-2" />
                    <DashboardCard title="Top Services by Count" type="bar" data={topServicesData} categoryKey="name" valueKey="count" className="lg:col-span-2" />
                </div>
            </DashboardSection>

             <DashboardSection id="available-requests" title="Available Booking Requests">
                {availableRequests.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No new booking requests available at this time.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {availableRequests.map(req => (
                            <Card key={req.id} className="border-primary/50 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">{req.therapyType}</CardTitle>
                                    <CardDescription>
                                        {new Date(req.date).toLocaleDateString()} at {req.time}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-2 text-sm space-y-1">
                                    <p><strong>Patient:</strong> {req.patientName}</p>
                                    <p><strong>Amount:</strong> ₹{req.serviceAmount}</p>
                                    <p><strong>Location:</strong> {req.serviceAddress ? "Patient's Address" : "Clinic/Online"}</p>
                                </CardContent>
                                <CardFooter className="flex justify-between gap-2">
                                    <Button variant="outline" className="w-full text-destructive" onClick={() => handleRejectRequest(req.id)}>Reject</Button>
                                    <Button className="w-full" onClick={() => handleAcceptRequest(req.id)}>Accept</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </DashboardSection>

             <DashboardSection id="schedule" title="Today's Appointments">
                <Card>
                    <CardContent className="pt-6">
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appointments.filter(a => new Date(a.date) >= todayStart && new Date(a.date) <= todayEnd && a.status !== 'Completed' && a.status !== 'Cancelled').map((appointment) => (
                            <TableRow key={appointment.id}>
                                <TableCell>{appointment.time}</TableCell>
                                <TableCell>{appointment.patientName}</TableCell>
                                <TableCell>{appointment.therapyType}</TableCell>
                                <TableCell><Badge variant="outline">{appointment.mode}</Badge></TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                     <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleStartSessionRequest(appointment)} 
                                        disabled={!!activeSession}
                                    >
                                        <PlayCircle className="mr-2 h-4 w-4"/>
                                        Start Journey
                                    </Button>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/pcr/${appointment.id}`}>PCR</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </DashboardSection>

             <DashboardSection id="upcoming" title="Upcoming Visits">
                <Card>
                    <CardContent className="pt-6">
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appointments.filter(a => new Date(a.date) > todayEnd && a.status !== 'Completed' && a.status !== 'Cancelled').slice(0, 5).map((appointment) => (
                            <TableRow key={appointment.id}>
                                <TableCell>{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</TableCell>
                                <TableCell>{appointment.patientName}</TableCell>
                                <TableCell>{appointment.therapyType}</TableCell>
                                <TableCell><Badge variant="outline">{appointment.mode}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/pcr/${appointment.id}`}>View Details</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </DashboardSection>

             <DashboardSection id="history" title="Booking History">
                <Card>
                    <CardContent className="pt-6">
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appointments.filter(a => a.status === 'Completed' || a.status === 'Cancelled' || a.status === 'No-Show').slice(0, 5).map((appointment) => (
                            <TableRow key={appointment.id}>
                                <TableCell>{new Date(appointment.date).toLocaleDateString()}</TableCell>
                                <TableCell>{appointment.patientName}</TableCell>
                                <TableCell>{appointment.therapyType}</TableCell>
                                <TableCell><Badge variant="secondary">{appointment.status}</Badge></TableCell>
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
                        {(earningsData?.earningsHistory || []).slice(0, 5).map((item: any) => (
                            <TableRow key={item.source}>
                                <TableCell>{new Date(item.sessionDate).toLocaleDateString()}</TableCell>
                                <TableCell><Badge variant={item.type === 'service' ? 'default' : 'secondary'}>{item.type}</Badge></TableCell>
                                <TableCell>{item.source}</TableCell>
                                <TableCell>₹{item.netPayable.toFixed(2)}</TableCell>
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
                        {(!earningsData?.earningsHistory || earningsData.earningsHistory.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-4">No earnings found.</TableCell>
                            </TableRow>
                        )}
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
                            {excludedItems.map(item => (
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
                 <Card>
                    <CardHeader>
                        <CardTitle>Grow Your Earnings</CardTitle>
                        <CardDescription>Share your permanent code with patients. They get 5% off products, and you earn a 10% commission on every sale.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-muted border">
                            <div className="text-center sm:text-left">
                            <p className="text-sm text-muted-foreground">Your Referral Code</p>
                            <p className="text-2xl font-bold font-mono tracking-widest">{therapist?.referralCode}</p>
                            </div>
                            <Button onClick={handleShareCode}>
                            <Share2 className="mr-2"/>
                            Share Code
                            </Button>
                        </div>
                    </CardContent>
                </Card>
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
