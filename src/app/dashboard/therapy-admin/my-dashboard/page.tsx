
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
import {
  Users,
  Calendar,
  ClipboardCheck,
  HandCoins,
  AlertCircle,
  FileDown,
  Printer,
  TrendingUp,
  UserCheck,
  Percent,
  Hourglass,
  Star,
} from "lucide-react";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import ReportAiSummary from "@/components/report/report-ai-summary";
import { FilterBar } from "@/components/admin/FilterBar";
import { Price } from "@/components/money/price";
import { getTherapyCategories } from "@/lib/repos/categories";
import { listProfileChangeRequests } from "@/lib/repos/content";
import type { ProfileChangeRequest, Appointment, PayoutItem } from '@/lib/types';
import { listAppointments } from "@/lib/repos/appointments";
import { listPayoutItems } from "@/lib/repos/payouts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getSafeDate } from "@/lib/utils";

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
);

const ActionableTable = ({ title, headers, children, action }: { title: string, headers: string[], children: React.ReactNode, action?: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            {action}
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow>{headers.map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
                <TableBody>{children}</TableBody>
            </Table>
        </CardContent>
    </Card>
);

export default function TherapyAdminDashboardPage() {
    const [profileChangeRequests, setProfileChangeRequests] = useState<ProfileChangeRequest[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [payoutItems, setPayoutItems] = useState<PayoutItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [requests, appointmentsData, payoutsData] = await Promise.all([
                listProfileChangeRequests(),
                listAppointments(),
                listPayoutItems()
            ]);
            setProfileChangeRequests(requests.filter(r => r.status === 'pending'));
            setAppointments(appointmentsData);
            setPayoutItems(payoutsData);
            setLoading(false);
        };
        fetchData();
    }, []);

    const kpis = useMemo(() => {
        const completedSessions = appointments.filter(a => a.status === 'Completed').length;
        const totalPcrs = appointments.filter(a => a.status === 'Completed' || a.status === 'Confirmed').length;
        const lockedPcrs = appointments.filter(a => a.pcrStatus === 'locked').length;
        const pcrLockRate = totalPcrs > 0 ? (lockedPcrs / totalPcrs) * 100 : 0;
        const noShowCount = appointments.filter(a => a.status === 'No-Show').length;
        const noShowRate = appointments.length > 0 ? (noShowCount / appointments.length) * 100 : 0;

        return {
            completedSessions,
            pcrLockRate: pcrLockRate.toFixed(1) + '%',
            noShowRate: noShowRate.toFixed(1) + '%'
        }
    }, [appointments]);
    
    const sessionsData = useMemo(() => {
        const dataMap = new Map<string, { sessionCount: number, cancelled: number }>();
        appointments.forEach(appt => {
            const date = getSafeDate(appt.date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!date) return;
            if (!dataMap.has(date)) dataMap.set(date, { sessionCount: 0, cancelled: 0 });
            const entry = dataMap.get(date)!;
            if (appt.status === 'Cancelled') {
                entry.cancelled += 1;
            } else {
                entry.sessionCount += 1;
            }
        });
        return Array.from(dataMap.entries()).map(([date, values]) => ({ date, ...values }));
    }, [appointments]);

    const modeSplitData = useMemo(() => {
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

    const unlockedPcrs = useMemo(() => {
        return appointments.filter(a => a.pcrStatus !== 'locked' && a.status === 'Completed').slice(0, 3);
    }, [appointments]);

    return (
        <div className="space-y-8">
            <div className="no-print space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight font-headline">Therapy Admin • My Dashboard</h1>
                        <p className="text-muted-foreground">An overview of therapy operations and therapist activity.</p>
                    </div>
                     <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2"/> Print</Button>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button><FileDown className="mr-2"/> Export CSV</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Upcoming Schedule</DropdownMenuItem>
                                <DropdownMenuItem>Unlocked PCRs</DropdownMenuItem>
                                <DropdownMenuItem>Pending Approvals</DropdownMenuItem>
                                <DropdownMenuItem>Payout Exceptions</DropdownMenuItem>
                                <DropdownMenuItem>SOS Alerts</DropdownMenuItem>
                                <DropdownMenuItem>Support Tickets</DropdownMenuItem>
                                <DropdownMenuItem>Latest Feedback</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                 <FilterBar
                    showDatePicker={true}
                    showLocationFilters={true}
                    showSearch={true}
                    showTherapyFilters={true}
                 />
            </div>

            <section id="report" className="print-area space-y-8">
                 <div className="print-only hidden text-center mb-8">
                    <h1 className="text-3xl font-bold">Therapy Ops Summary</h1>
                    <p className="text-muted-foreground">For period: Last 90 Days</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <KpiCard title="Sessions Completed" value={kpis.completedSessions} icon={TrendingUp} />
                    <KpiCard title="Active Therapists" value="152" icon={Users} />
                    <KpiCard title="PCR Lock Rate" value={kpis.pcrLockRate} icon={Percent} />
                    <KpiCard title="No-Show Rate" value={kpis.noShowRate} icon={Calendar} />
                </div>

                <ReportAiSummary 
                    summaryText={[
                        "High number of pending PCRs is delaying ~₹18,000 in payouts. Send reminders.",
                        "Dr. Evelyn Reed has the highest patient satisfaction rating this month.",
                        "Consider recruiting more Speech Therapists due to high demand in Vadodara.",
                    ]}
                    regenerate={() => console.log('regenerate')}
                    copy={() => console.log('copy')}
                />
                
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardCard title="Sessions per day (90d)" type="line" data={sessionsData} categoryKey="date" valueKey="sessionCount" loading={loading} />
                    <DashboardCard title="Bookings by Mode (90d)" type="pie" data={modeSplitData} categoryKey="name" valueKey="value" loading={loading} />
                    <DashboardCard title="Top 10 Services by Revenue (90d)" type="bar" data={topServicesData} categoryKey="name" valueKey="revenue" loading={loading} />
                    <DashboardCard title="Payout Pipeline (Last 4 Weeks)" type="bar" data={payoutPipelineData} categoryKey="week" valueKey="paid" loading={loading} />
                </div>

                 <ActionableTable title="Unlocked PCRs (>24h)" headers={['Booking', 'Therapist', 'Patient', 'Age', 'Action']}>
                     {unlockedPcrs.map(pcr => (
                        <TableRow key={pcr.id}>
                            <TableCell>{pcr.id}</TableCell>
                            <TableCell>{pcr.therapist}</TableCell>
                            <TableCell>{pcr.patientName}</TableCell>
                            <TableCell><Badge variant="destructive">25h</Badge></TableCell>
                            <TableCell><Button variant="outline" size="sm">Open PCR</Button></TableCell>
                        </TableRow>
                     ))}
                </ActionableTable>
                 <ActionableTable title="Pending Profile Approvals" headers={['User', 'Fields Changed', 'Submitted', 'Action']}>
                    {profileChangeRequests.map(req => (
                        <TableRow key={req.id}>
                            <TableCell>{req.userId}</TableCell>
                            <TableCell>{req.changes.map(c => c.fieldPath).join(', ')}</TableCell>
                            <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell><Button variant="outline" size="sm">Review</Button></TableCell>
                        </TableRow>
                    ))}
                </ActionableTable>
            </section>
        </div>
    );
}
