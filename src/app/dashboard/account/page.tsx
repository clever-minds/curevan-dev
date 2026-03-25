
'use client';

import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { Skeleton } from "@/components/ui/skeleton";
import { TherapistOnboardingForm } from "@/app/auth/therapist-signup/therapist-onboarding-form";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { FileDown, Edit, TrendingUp, CalendarDays, Wallet, Star, FileText, Receipt, PackageOpen } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ReportAiSummary from "@/components/report/report-ai-summary";
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserProfiledata } from "@/lib/api/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/money/price";
import { useEffect, useState } from "react";
import type { Appointment, Product } from "@/lib/types";
import { listAppointmentsForUser } from "@/lib/repos/appointments";
import { listProducts } from "@/lib/repos/products";
import { useToast } from '@/hooks/use-toast'; // ⭐ add this
import { getUserProfile } from "@/lib/api/auth";
export const dynamic = 'force-dynamic';

const sessionData = [
  { date: 'Week 1', sessionCount: 1 },
  { date: 'Week 2', sessionCount: 2 },
  { date: 'Week 3', sessionCount: 1 },
  { date: 'Week 4', sessionCount: 1 },
];
const spendData = [
    { name: 'Services', value: 7500 },
    { name: 'Products', value: 2500 },
];
const mockPayments = [
    { id: 'pay_1', date: '2024-07-08', type: 'Service', amount: 1500, status: 'Paid', link: '/dashboard/invoices?id=INV-BK001' },
    { id: 'pay_2', date: '2024-07-05', type: 'Product', amount: 2500, status: 'Paid', link: '/dashboard/invoices?id=ORD001' },
    { id: 'pay_3', date: '2024-07-03', type: 'Service', amount: 3000, status: 'Paid', link: '/dashboard/invoices?id=INV-BK002' },
];
const mockOrders = [
    { id: 'ORD001', items: `TENS Unit...`, amount: 2500, status: 'Delivered', link: '/dashboard/orders' }
];

const DashboardSection = ({ id, title, children, className }: { id: string, title: string, children: React.ReactNode, className?: string }) => (
    <section id={id} className={cn("scroll-mt-24 space-y-4 avoid-break", className)}>
        <h2 className="text-2xl font-bold font-headline">{title}</h2>
        {children}
    </section>
);

const KpiCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card className="avoid-break">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{typeof value === 'number' ? <Price amount={value} /> : value}</div>
        </CardContent>
    </Card>
)

export default function AccountPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const { toast } = useToast(); 


  useEffect(() => {
    async function fetchData() {
        if (!user) return;
        setLoading(true);
        const [appointmentData, productData] = await Promise.all([
            listAppointmentsForUser(user.id, 'patient'),
            listProducts()
        ]);
        setAppointments(appointmentData);
        setProducts(productData);
        setLoading(false);
    }
    fetchData();
  }, [user]);

  if (!user || loading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  // Render different components based on user role
  switch (user.role) {
    case 'therapist':
      return (
         <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-headline">My Profile</h1>
              <p className="text-muted-foreground">Manage your public profile, professional details, availability, and bank information.</p>
            </div>
            <TherapistOnboardingForm isEditing={true} />
         </div>
      );
    case 'admin':
      return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline">Admin Settings</h1>
                <p className="text-muted-foreground">Manage your admin profile details.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <ProfileForm />
                </CardContent>
            </Card>
        </div>
      );
    case 'patient':
    default:
      return (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight font-headline">My Dashboard</h1>
              <p className="text-muted-foreground">An overview of your health journey with Curevan.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" asChild><Link href="/dashboard/account/edit"><Edit className="mr-2"/> Edit Profile</Link></Button>
                <Button onClick={() => window.print()}><FileDown className="mr-2"/> Print / Download Report</Button>
            </div>
          </div>
          
          <div id="report" className="print-area space-y-12">
            <div className="print-only hidden text-center mb-8">
                <h1 className="text-3xl font-bold">Patient Health Report</h1>
                <p className="text-muted-foreground">For period: Jan 1, 2024 - Jul 31, 2024</p>
            </div>

             {/* KPIs */}
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Upcoming Appointments" value="2" icon={CalendarDays} />
                <KpiCard title="Services Spend (90d)" value={7500} icon={Wallet} />
                <KpiCard title="Shop Spend (90d)" value={2500} icon={PackageOpen} />
             </div>

             <ReportAiSummary 
                summaryText={[
                    "Your last physiotherapy session focused on improving knee flexibility.",
                    "Your recent payment of ₹2,500 for a Resistance Bands Set was successful.",
                    "Your next appointment is with Dr. Evelyn Reed."
                ]}
                regenerate={() => console.log('regenerate')}
                copy={() => console.log('copy')}
             />

            <DashboardSection id="charts" title="Insights (Last 90 Days)">
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardCard title="Bookings by Week" type="bar" data={sessionData} categoryKey="date" valueKey="sessionCount" />
                    <DashboardCard title="Spend by Category" type="pie" data={spendData} categoryKey="name" valueKey="value" />
                </div>
            </DashboardSection>

             <DashboardSection id="recent-sessions" title="Recent Sessions">
                <Card>
                    <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Therapist</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Links</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {appointments.slice(0,3).map((appointment) => (
                            <TableRow key={appointment.id}>
                                <TableCell>{new Date(appointment.date).toLocaleDateString()}</TableCell>
                                <TableCell>{appointment.therapyType}</TableCell>
                                <TableCell>{appointment.therapist}</TableCell>
                                <TableCell><Badge variant="secondary">{appointment.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <Button variant="link" size="sm" asChild>
                                        <Link href={`/pcr/${appointment.id}`}>View PCR</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </DashboardSection>

            <DashboardSection id="payments" title="Recent Payments">
                <Card>
                    <CardContent className="pt-6">
                     <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                             <TableHead>Status</TableHead>
                            <TableHead className="text-right">Receipt</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {mockPayments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                <TableCell>{payment.type}</TableCell>
                                <TableCell><Price amount={payment.amount} showDecimals /></TableCell>
                                <TableCell><Badge variant="secondary" className="bg-green-100 text-green-800">{payment.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                     <Button variant="link" size="sm" asChild>
                                        <Link href={`/dashboard/invoices?id=${payment.link.split("=").pop()}`}><Receipt className="mr-2"/>View Invoice</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </DashboardSection>

             <CardFooter className="justify-end gap-2 pt-4">
                <Button variant="outline" asChild><Link href="/dashboard/bookings">View all bookings</Link></Button>
                <Button asChild><Link href="/discover">Book a new session</Link></Button>
            </CardFooter>

          </div>
        </div>
      );
  }
}
