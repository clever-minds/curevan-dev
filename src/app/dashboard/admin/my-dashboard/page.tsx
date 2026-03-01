
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, Calendar, ClipboardCheck, TrendingUp, HandCoins, Percent, AlertCircle, FileDown, BookCopy, BookUser, ShoppingBag, Send, UserCheck, Sparkles, UserPlus, HeartPulse, ShoppingBasket, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ReportAiSummary from "@/components/report/report-ai-summary";
import { Price } from "@/components/money/price";
import { FilterBar } from "@/components/admin/FilterBar";
import type { Documentation, Training, ProfileChangeRequest, Appointment, Order, PayoutItem } from "@/lib/types";
import { listDocumentation, listProfileChangeRequests, listTrainings } from "@/lib/repos/content";
import { getPublicStats } from "@/lib/repos/stats"; 
import { listAppointments } from "@/lib/repos/appointments";
import { listOrders } from "@/lib/repos/orders";
import { listPayoutItems } from "@/lib/repos/payouts";
import { getSafeDate } from "@/lib/utils";

export const dynamic = 'force-dynamic';

const KpiCard = ({ title, value, icon: Icon, description, loading }: { title: string, value: string | number, icon: React.ElementType, description?: string, loading?: boolean }) => (
    <Card className="avoid-break">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {loading ? <div className="h-8 w-24 bg-muted animate-pulse rounded-md" /> : (
                <div className="text-2xl font-bold">{typeof value === 'number' ? <Price amount={value} /> : value}</div>
            )}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const ActionableTable = ({ title, description, headers, children, actionHref, actionText }: { title: string, description: string, headers: string[], children: React.ReactNode, actionHref: string, actionText: string }) => (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                 <Button asChild variant="outline" size="sm" className="no-print">
                    <Link href={actionHref}>{actionText}</Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow>{headers.map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
                <TableBody>{children}</TableBody>
            </Table>
        </CardContent>
    </Card>
);


export default function AdminDashboardPage() {
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [documentation, setDocumentation] = useState<Documentation[]>([]);
    const [profileChangeRequests, setProfileChangeRequests] = useState<ProfileChangeRequest[]>([]);
    const [stats, setStats] = useState<Awaited<ReturnType<typeof getPublicStats>> | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});

    // New states for chart data
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [payoutItems, setPayoutItems] = useState<PayoutItem[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [trainingsData, docsData, requestsData, statsData, appointmentsData, ordersData, payoutsData] = await Promise.all([
                listTrainings(),
                listDocumentation(),
                listProfileChangeRequests(),
                getPublicStats(),
                listAppointments(filters),
                listOrders(filters),
                listPayoutItems(filters),
            ]);
            setTrainings(trainingsData);
            setDocumentation(docsData);
            setProfileChangeRequests(requestsData);
            setStats(statsData);
            setAppointments(appointmentsData);
            setOrders(ordersData);
            setPayoutItems(payoutsData);
            setLoading(false);
        };
        fetchData();
    }, [filters]); 

    const contentDrafts = useMemo(() => {
        return [
            ...trainings.filter(t => t.status === 'draft').map(t => ({...t, type: 'Training'})),
            ...documentation.filter(d => d.status === 'draft').map(d => ({...d, type: 'SOP'}))
        ]
    }, [trainings, documentation]);

    // Chart data processing logic
    const revenueData = useMemo(() => {
        const dataMap = new Map<string, { revenue: number, refunds: number }>();
        orders.forEach(order => {
            const date = getSafeDate(order.createdAt)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!date) return;
            if (!dataMap.has(date)) dataMap.set(date, { revenue: 0, refunds: 0 });
            const entry = dataMap.get(date)!;
            if (order.status !== 'Refunded') {
                entry.revenue += (order.total || 0) / 100;
            } else {
                entry.refunds += (order.total || 0) / 100;
            }
        });
        return Array.from(dataMap.entries()).map(([date, values]) => ({ date, ...values }));
    }, [orders]);

    const bookingsByModeData = useMemo(() => {
        const counts = appointments.reduce((acc, appt) => {
            const mode = appt.mode.charAt(0).toUpperCase() + appt.mode.slice(1);
            acc[mode] = (acc[mode] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [appointments]);

    const topServicesData = useMemo(() => {
        const serviceMap = new Map<string, number>();
        appointments.forEach(appt => {
            const revenue = appt.totalAmount || 0;
            serviceMap.set(appt.therapyType, (serviceMap.get(appt.therapyType) || 0) + revenue);
        });
        return Array.from(serviceMap.entries())
            .map(([name, revenue]) => ({ name, revenue: revenue / 100 }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
    }, [appointments]);

    const payoutPipelineData = useMemo(() => {
        const statusMap = new Map<string, { onHold: number, inBatch: number, paid: number }>();
        payoutItems.forEach(item => {
            const date = getSafeDate(item.weekStart);
            if (!date) return;
            const week = `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            if (!statusMap.has(week)) statusMap.set(week, { onHold: 0, inBatch: 0, paid: 0 });
            const entry = statusMap.get(week)!;
            if(item.state === 'onHold') entry.onHold += item.netAmount;
            if(item.state === 'inBatch') entry.inBatch += item.netAmount;
            if(item.state === 'paid') entry.paid += item.netAmount;
        });
        return Array.from(statusMap.entries()).map(([week, values]) => ({ week, ...values }));
    }, [payoutItems]);

  return (
    <div className="space-y-8">
       <div className="flex flex-wrap items-center justify-between gap-4 no-print">
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-headline">Super Admin Dashboard</h1>
              <p className="text-muted-foreground">A high-level overview of your platform's activity.</p>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => window.print()} className="no-print"><FileDown className="mr-2"/> Print Report</Button>
            </div>
        </div>

        <div className="no-print">
            <FilterBar
                showDatePicker={true}
                showLocationFilters={true}
                showTherapyFilters={true}
                showEcomFilters={true}
                onFilterChange={setFilters}
            />
        </div>

        <div id="report" className="print-area space-y-12">
            <div className="print-only hidden text-center mb-8">
                <h1 className="text-3xl font-bold">Curevan Org Summary</h1>
                <p className="text-muted-foreground">For period: Last 90 Days</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
                <Link href="/dashboard/ecom-admin/my-dashboard">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex-row items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg"><ShoppingBasket className="w-8 h-8 text-primary"/></div>
                            <div>
                                <CardTitle>E-commerce Dashboard</CardTitle>
                                <CardDescription>View detailed product sales, inventory, and fulfillment metrics.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/dashboard/therapy-admin/my-dashboard">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex-row items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg"><HeartPulse className="w-8 h-8 text-primary"/></div>
                            <div>
                                <CardTitle>Therapy Ops Dashboard</CardTitle>
                                <CardDescription>View detailed therapy appointments, PCR status, and therapist performance.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
            </div>
      
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <KpiCard title="Total Users" value={stats?.usersTotal ?? 0} icon={Users} loading={loading} />
                <KpiCard title="Active Therapists" value={stats?.therapistsTotal ?? 0} icon={UserCheck} loading={loading} />
                <KpiCard title="Sessions Completed" value={stats?.patientsServedTotal ?? 0} icon={Calendar} loading={loading} />
                <KpiCard title="Products Sold" value={stats?.productsDeliveredTotal ?? 0} icon={ShoppingBag} loading={loading} />
                <KpiCard title="Refunds (90d)" value={12340} icon={DollarSign} loading={loading} />
            </div>

            <ReportAiSummary 
                summaryText={[
                    "Product sales are up 15% WoW, driven by the new Resistance Bands promotion.",
                    "Therapist onboarding has slowed; consider a new recruitment campaign.",
                    "High refund rate for 'Online Consultations' from new patients. Investigate service quality or expectation mismatch."
                ]}
                regenerate={() => console.log('regenerate')}
                copy={() => console.log('copy')}
             />

            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <DashboardCard title="Revenue vs Refunds (90d)" type="line" data={revenueData} categoryKey="date" valueKey="revenue" className="lg:col-span-2" loading={loading} />
                    <DashboardCard title="Bookings by Mode (90d)" type="pie" data={bookingsByModeData} categoryKey="name" valueKey="value" loading={loading} />
                </div>
                <div className="grid gap-6 md:grid-cols-1">
                    <DashboardCard title="Top 10 Services by Revenue (90d)" type="bar" data={topServicesData} categoryKey="name" valueKey="revenue" loading={loading} />
                    <DashboardCard title="Payout Pipeline (Last 4 Weeks)" type="bar" data={payoutPipelineData} categoryKey="week" valueKey="paid" loading={loading} />
                </div>
            </div>

            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                <ActionableTable 
                    title="Pending Profile Approvals" 
                    description="Review and approve/reject user profile changes."
                    headers={['User', 'Role', 'Section', 'Submitted']}
                    actionHref="/dashboard/admin/profile-approvals"
                    actionText="View All"
                >
                    {profileChangeRequests.filter(r => r.status === 'pending').slice(0,3).map(req => (
                        <TableRow key={req.id}>
                            <TableCell>{req.userId}</TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{req.role}</Badge></TableCell>
                            <TableCell>{req.section}</TableCell>
                            <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                    ))}
                </ActionableTable>

                 <ActionableTable 
                    title="Recent SOS Alerts" 
                    description="Active and recently resolved emergency alerts."
                    headers={['Therapist', 'Status', 'Time']}
                    actionHref="/dashboard/admin/sos-alerts"
                    actionText="Go to Alerts"
                >
                    {/* Mock data for now */}
                </ActionableTable>
            </div>
            
             <ActionableTable 
                title="Content Pipeline" 
                description="Drafts awaiting review and publication."
                headers={['Title', 'Type', 'Author']}
                actionHref="/dashboard/admin/journal"
                actionText="Manage Content"
            >
                {contentDrafts.slice(0,3).map(item => (
                     <TableRow key={item.id}>
                        <TableCell>{item.title}</TableCell>
                        <TableCell><Badge variant="secondary">{item.type}</Badge></TableCell>
                         <TableCell>{item.authorId}</TableCell>
                    </TableRow>
                ))}
            </ActionableTable>

             <div className="no-print">
                <h3 className="text-xl font-bold font-headline mb-4">Quick Links</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <Button asChild variant="outline"><Link href="/dashboard/admin/users"><UserCheck className="mr-2"/>Users</Link></Button>
                    <Button asChild variant="outline"><Link href="/dashboard/admin/team"><Users className="mr-2"/>Team</Link></Button>
                    <Button asChild variant="outline"><Link href="/dashboard/admin/appointments"><BookUser className="mr-2"/>Bookings</Link></Button>
                    <Button asChild variant="outline"><Link href="/dashboard/admin/products"><ShoppingBag className="mr-2"/>Products</Link></Button>
                    <Button asChild variant="outline"><Link href="/dashboard/admin/payouts"><HandCoins className="mr-2"/>Payouts</Link></Button>
                    <Button asChild variant="outline"><Link href="/dashboard/admin/support-tickets"><Send className="mr-2"/>Tickets</Link></Button>
                    <Button asChild variant="outline"><Link href="/dashboard/admin/ai"><Sparkles className="mr-2"/>AI / RAG</Link></Button>
                    <Button asChild variant="outline"><Link href="/dashboard/admin/settings"><Settings className="mr-2"/>Settings</Link></Button>
                </div>
            </div>
        </div>
    </div>
  );
}
