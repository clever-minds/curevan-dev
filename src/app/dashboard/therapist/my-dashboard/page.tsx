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
import { PlayCircle, Clock, FilePlus, Share2, TrendingUp, Users, Percent, Wallet, Star, FileDown, Edit, GitBranch, AlertCircle, CheckCircle, Hourglass, ArrowRight } from "lucide-react";
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
import ReportAiSummary from "@/components/report/report-ai-summary";
import { getEarningsHistory } from "@/services/earnings-service";
import { Price } from "@/components/money/price";
import { listAppointmentsForUser } from "@/lib/repos/appointments";
import { getTherapistById } from "@/lib/repos/therapists";
import { getTherapyCategories } from "@/lib/repos/meta";

export const dynamic = 'force-dynamic';

const sessionData = [
    { date: '2024-07-22', sessionCount: 20, cancelled: 2 },
    { date: '2024-07-23', sessionCount: 30, cancelled: 5 },
    { date: '2024-07-24', sessionCount: 15, cancelled: 1 },
    { date: '2024-07-25', sessionCount: 40, cancelled: 3 },
];
const modeSplitData = [
    { name: 'Home Visit', value: 9 },
    { name: 'Online', value: 3 },
    { name: 'Clinic', value: 1 },
];
const weeklyEarningsData = [
  { week: 'Jul 1-7', Service: 6500, Product: 400 },
  { week: 'Jul 8-14', Service: 7200, Product: 650 },
  { week: 'Jul 15-21', Service: 8100, Product: 300 },
  { week: 'Jul 22-28', Service: 7500, Product: 800 },
];

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
            <div className="text-2xl font-bold">{typeof value === 'number' ? <Price amount={value} /> : value}</div>
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

  const earningsHistory = useMemo(() => getEarningsHistory('therapist-123', 'mtd'), []);
  const excludedItems = earningsHistory.filter(e => e.status === 'On-Hold');

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
            const [appointmentData, therapistData, therapyCats] = await Promise.all([
                listAppointmentsForUser(user.uid, 'therapist'),
                getTherapistById(user.uid),
                getTherapyCategories()
            ]);
            setAppointments(appointmentData);
            setTherapist(therapistData);
            setTopServicesData(therapyCats.slice(0,3).map(cat => ({
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
    // This simulates the "Verify patient (OTP/QR/GEOFENCE)" step (B2 in DFD)
    setVerifyingAppointment(appointment);
  };
  
  const handleVerificationSuccess = (appointment: Appointment) => {
    // This simulates creating a `sessions` row and starting the timer (B3 in DFD)
    setActiveSession(appointment);
    setVerifyingAppointment(null);
  }

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

            {activeSession && (
                <ActiveSessionCard session={activeSession} onEndSession={handleEndSession} />
            )}

            {/* KPIs */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Sessions Completed (90d)" value="128" icon={TrendingUp} />
                <KpiCard title="PCR Lock Rate (90d)" value="92%" icon={Percent} />
                <KpiCard title="Net Payout (90d)" value={128500} icon={Wallet} />
                <KpiCard title="Product Commissions (90d)" value={8750} icon={Wallet} />
                <KpiCard title="Unique Patients (90d)" value="42" icon={Users} />
                <KpiCard title="Avg. Rating (90d)" value="4.9" icon={Star} />
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

            <DashboardSection id="charts" title="Insights (Last 90 Days)">
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardCard title="Sessions Per Day" type="line" data={sessionData} categoryKey="date" valueKey="sessionCount" />
                    <DashboardCard title="Session Mode Split" type="pie" data={modeSplitData} categoryKey="name" valueKey="value" />
                    <DashboardCard title="Weekly Earnings (Net)" type="bar" data={weeklyEarningsData} categoryKey="week" valueKey="Service" className="lg:col-span-2" />
                    <DashboardCard title="Top Services by Count" type="bar" data={topServicesData} categoryKey="name" valueKey="count" className="lg:col-span-2" />
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
                        {earningsHistory.map((item) => (
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
                            <p className="text-2xl font-bold font-mono tracking-widest">{therapist?.referralCode || "N/A"}</p>
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
