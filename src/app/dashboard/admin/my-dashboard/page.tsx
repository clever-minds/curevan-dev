
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
import type { KnowledgeBase, ProfileChangeRequest, Appointment, Order, PayoutItem, SupportTicket, SOSAlert } from "@/lib/types";
import { listDocumentation, listProfileChangeRequests, listTrainings } from "@/lib/repos/content";
import { getPublicStats } from "@/lib/repos/stats";
import { listAppointments } from "@/lib/repos/appointments";
import { listOrders } from "@/lib/repos/orders";
import { listPayoutItems } from "@/lib/repos/payouts";
import { listSupportTickets } from "@/lib/repos/support";
import { listSosAlerts } from "@/lib/repos/alerts";
import { getSafeDate } from "@/lib/utils";

export const dynamic = 'force-dynamic';

const KpiCard = ({ title, value, icon: Icon, description, loading, showCurrency = true }: { title: string, value: string | number, icon: React.ElementType, description?: string, loading?: boolean, showCurrency?: boolean }) => (
    <Card className="avoid-break shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 pt-4 px-3 sm:px-6 uppercase tracking-wider text-[10px] font-bold text-muted-foreground opacity-70">
            <CardTitle className="text-[10px] leading-tight">{title}</CardTitle>
            <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 pt-1">
            {loading ? <div className="h-6 sm:h-8 w-16 sm:w-24 bg-muted animate-pulse rounded-md" /> : (
                <div className="text-lg sm:text-2xl font-bold tracking-tight">
                    {typeof value === 'number' && showCurrency ? <Price amount={value} /> : value}
                </div>
            )}
            {description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{description}</p>}
        </CardContent>
    </Card>
);

const ActionableTable = ({ title, description, headers, children, actionHref, actionText }: { title: string, description: string, headers: string[], children: React.ReactNode, actionHref: string, actionText: string }) => (
    <Card className="shadow-sm overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <CardTitle className="text-lg font-headline truncate">{title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-1">{description}</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="no-print w-full sm:w-auto h-8 text-xs font-bold uppercase tracking-widest">
                    <Link href={actionHref}>{actionText}</Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0 overflow-hidden">
            <div className="border-t sm:border sm:rounded-md bg-white/50 w-full max-w-[calc(100vw-2.5rem)] sm:max-w-full overflow-hidden">
                <Table className="min-w-[500px] lg:min-w-full">
                    <TableHeader className="bg-muted/30"><TableRow>{headers.map(h => <TableHead key={h} className="text-[10px] uppercase font-bold tracking-wider px-2 sm:px-4 first:pl-4">{h}</TableHead>)}</TableRow></TableHeader>
                    <TableBody>{children}</TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
);


export default function AdminDashboardPage() {
    if (typeof window !== 'undefined') {
        console.log("💎 AdminDashboardPage component is RENDERED");
        // window.alert("DASHBOARD CODE IS RUNNING"); 
    }
    const [trainings, setTrainings] = useState<KnowledgeBase[]>([]);
    const [documentation, setDocumentation] = useState<KnowledgeBase[]>([]);
    const [profileChangeRequests, setProfileChangeRequests] = useState<ProfileChangeRequest[]>([]);
    const [stats, setStats] = useState<Awaited<ReturnType<typeof getPublicStats>> | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});

    // New states for chart data
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [payoutItems, setPayoutItems] = useState<PayoutItem[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            console.log("🚀 Browser: Starting dashboard data fetch...");
            setLoading(true);
            try {
                const results = await Promise.all([
                    listTrainings(),
                    listDocumentation(),
                    listProfileChangeRequests(),
                    getPublicStats(),
                    listAppointments(filters),
                    listOrders(filters),
                    listPayoutItems(filters),
                    listSupportTickets(),
                    listSosAlerts(),
                ]);

                const [trainingsData, docsData, requestsData, statsData, appointmentsData, ordersData, payoutsData, supportTicketsData, sosAlertsData] = results;

                console.log("✅ Data received from backend:", { statsData, ordersCount: ordersData?.length });

                setTrainings(trainingsData);
                setDocumentation(docsData);
                setProfileChangeRequests(requestsData);
                setStats(statsData);
                setAppointments(appointmentsData);
                setOrders(ordersData || []);
                setPayoutItems(payoutsData);
                setSupportTickets(supportTicketsData || []);
                setSosAlerts(sosAlertsData || []);
            } catch (error: any) {
                console.error("❌ FATAL Error in fetchData:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters]);

    const contentDrafts = useMemo(() => {
        return [
            ...trainings.filter(t => t.status === 'draft').map(t => ({ ...t, type: 'Training' })),
            ...documentation.filter(d => d.status === 'draft').map(d => ({ ...d, type: 'SOP' }))
        ]
        
    }, [trainings, documentation]);

    // Chart data processing logic
    const revenueData = useMemo(() => {
        const dataMap = new Map<string, { revenue: number, refunds: number }>();
        (orders ?? []).forEach(order => {
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
            if (item.state === 'onHold') entry.onHold += item.netAmount;
            if (item.state === 'inBatch') entry.inBatch += item.netAmount;
            if (item.state === 'paid') entry.paid += item.netAmount;
        });
        console.log("statusMap", statusMap);

        return Array.from(statusMap.entries()).map(([week, values]) => ({ week, ...values }));
    }, [payoutItems]);

    const totalRefunds = useMemo(() => {
        return orders
            .filter(o => o.status === 'Refunded')
            .reduce((sum, o) => sum + (o.total || 0), 0);
    }, [orders]);

    return (
        <div className="space-y-8 w-full max-w-full overflow-x-hidden px-1 sm:px-0">
            <div className="flex flex-wrap items-center justify-between gap-4 no-print">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-headline">Super Admin Dashboard</h1>
                    <p className="text-muted-foreground">A high-level overview of your platform's activity.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => window.print()} className="no-print"><FileDown className="mr-2" /> Print Report</Button>
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

            <div id="report" className="print-area space-y-12 w-full max-w-full overflow-hidden">
                <div className="print-only hidden text-center mb-8">
                    <h1 className="text-3xl font-bold">Curevan Org Summary</h1>
                    <p className="text-muted-foreground">For period: Last 90 Days</p>
                </div>

                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 w-full overflow-hidden">
                    <Link href="/dashboard/ecom-admin/my-dashboard">
                        <Card className="hover:bg-muted/80 transition-all cursor-pointer group active:scale-[0.99] border-primary/10 hover:border-primary/30 shadow-sm">
                            <CardHeader className="flex-row items-center gap-3 sm:gap-4 p-4 sm:p-6">
                                <div className="p-2 sm:p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                    <ShoppingBasket className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <CardTitle className="group-hover:text-primary transition-colors text-base sm:text-lg truncate font-headline">E-commerce</CardTitle>
                                        <Send className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform shrink-0" />
                                    </div>
                                    <CardDescription className="text-xs line-clamp-1 sm:line-clamp-none">Sales, inventory, & fulfillment.</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                    <Link href="/dashboard/therapy-admin/my-dashboard">
                        <Card className="hover:bg-muted/80 transition-all cursor-pointer group active:scale-[0.99] border-primary/10 hover:border-primary/30 shadow-sm">
                            <CardHeader className="flex-row items-center gap-3 sm:gap-4 p-4 sm:p-6">
                                <div className="p-2 sm:p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                    <HeartPulse className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <CardTitle className="group-hover:text-primary transition-colors text-base sm:text-lg truncate font-headline">Therapy Ops</CardTitle>
                                        <Send className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform shrink-0" />
                                    </div>
                                    <CardDescription className="text-xs line-clamp-1 sm:line-clamp-none">Appointments, PCRs, & therapists.</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                </div>

                <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-5 w-full">
                    <KpiCard title="Total Users" value={stats?.usersTotal ?? 0} icon={Users} loading={loading} showCurrency={false} />
                    <KpiCard title="Active Therapists" value={stats?.therapistsTotal ?? 0} icon={UserCheck} loading={loading} showCurrency={false} />
                    <KpiCard title="Sessions Completed" value={stats?.patientsServedTotal ?? 0} icon={Calendar} loading={loading} showCurrency={false} />
                    <KpiCard title="Products Sold" value={stats?.productsDeliveredTotal ?? 0} icon={ShoppingBag} loading={loading} showCurrency={false} />
                    <KpiCard title="Refunds (90d)" value={totalRefunds} icon={DollarSign} loading={loading} />
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

                <div className="space-y-6 w-full overflow-hidden">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
                        <DashboardCard title="Revenue vs Refunds (90d)" type="line" data={revenueData} categoryKey="date" valueKey="revenue" className="lg:col-span-2" loading={loading} isCurrency={true} />
                        <DashboardCard title="Bookings by Mode (90d)" type="pie" data={bookingsByModeData} categoryKey="name" valueKey="value" loading={loading} isCurrency={false} />
                    </div>
                    <div className="grid gap-6 md:grid-cols-1">
                        <DashboardCard title="Top 10 Services by Revenue (90d)" type="bar" data={topServicesData} categoryKey="name" valueKey="revenue" loading={loading} isCurrency={true} />
                        <DashboardCard title="Payout Pipeline (Last 4 Weeks)" type="bar" data={payoutPipelineData} categoryKey="week" valueKey="paid" loading={loading} isCurrency={true} />
                    </div>
                </div>

                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    <ActionableTable
                        title="Pending Profile Approvals"
                        description="Review and approve/reject user profile changes."
                        headers={['User', 'Role', 'Section', 'Submitted']}
                        actionHref="/dashboard/admin/profile-approvals"
                        actionText="View All"
                    >
                        {profileChangeRequests?.filter(r => r.status === 'pending').slice(0, 3).map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.userId}</TableCell>
                                <TableCell><Badge variant="outline" className="capitalize">{req.role}</Badge></TableCell>
                                <TableCell>{req.section}</TableCell>
                                <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                        {profileChangeRequests?.filter(r => r.status === 'pending').length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No pending requests.</TableCell></TableRow>}
                    </ActionableTable>

                    <ActionableTable
                        title="Recent SOS Alerts"
                        description="Active and recently resolved emergency alerts."
                        headers={['Therapist', 'Status', 'Time']}
                        actionHref="/dashboard/admin/sos-alerts"
                        actionText="Go to Alerts"
                    >
                        {sosAlerts.slice(0, 3).map(alert => (
                            <TableRow key={alert.id}>
                                <TableCell className="font-medium">{alert.therapistName}</TableCell>
                                <TableCell><Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'} className="capitalize">{alert.status}</Badge></TableCell>
                                <TableCell>{alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                        {sosAlerts.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No alerts found.</TableCell></TableRow>}
                    </ActionableTable>

                    <ActionableTable
                        title="Recent Support Tickets"
                        description="New and pending user support requests."
                        headers={['Subject', 'Status', 'Updated']}
                        actionHref="/dashboard/admin/support-tickets"
                        actionText="View All"
                    >
                        {supportTickets.slice(0, 3).map(ticket => (
                            <TableRow key={ticket.id}>
                                <TableCell className="font-medium truncate max-w-[150px]">{ticket.subject}</TableCell>
                                <TableCell>
                                    <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'} className="capitalize">{ticket.status}</Badge>
                                </TableCell>
                                <TableCell>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                        {supportTickets.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No tickets found.</TableCell></TableRow>}
                    </ActionableTable>
                </div>

                <ActionableTable
                    title="Content Pipeline"
                    description="Drafts awaiting review and publication."
                    headers={['Title', 'Type', 'Author']}
                    actionHref="/dashboard/admin/journal"
                    actionText="Manage Content"
                >
                    {contentDrafts.slice(0, 3).map(item => (
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
                        <Button asChild variant="outline"><Link href="/dashboard/admin/users"><UserCheck className="mr-2" />Users</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard/admin/team"><Users className="mr-2" />Team</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard/admin/appointments"><BookUser className="mr-2" />Bookings</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard/admin/products"><ShoppingBag className="mr-2" />Products</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard/admin/payouts"><HandCoins className="mr-2" />Payouts</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard/admin/support-tickets"><Send className="mr-2" />Tickets</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard/admin/ai"><Sparkles className="mr-2" />AI / RAG</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard/admin/settings"><Settings className="mr-2" />Settings</Link></Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
