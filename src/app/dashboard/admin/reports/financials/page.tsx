
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/admin/FilterBar";
import { Price } from "@/components/money/price";
import { useState, useEffect, useMemo } from "react";
import type { PayoutItem, Therapist } from "@/lib/types";
import { listPayoutItems } from "@/lib/repos/payouts";
import { listTherapists } from "@/lib/repos/therapists";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown } from "lucide-react";
import { getSafeDate, downloadCsv } from "@/lib/utils";

export const dynamic = 'force-dynamic';

type CombinedPayoutItem = PayoutItem & {
    therapistName?: string;
    therapistPan?: string;
}

export default function FinancialReportPage() {
    const [payoutItems, setPayoutItems] = useState<PayoutItem[]>([]);
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});

 useEffect(() => {
    const fetchData = async () => {
        setLoading(true);

        const [payoutData, therapistData] = await Promise.all([
            listPayoutItems(filters),
            listTherapists()
        ]);

        setPayoutItems(payoutData || []);
        setTherapists(therapistData || []); // <-- here null becomes []
        setLoading(false);
    };

    fetchData();
}, [filters]);
    const combinedData: CombinedPayoutItem[] = useMemo(() => {
        const therapistMap = new Map(therapists.map(t => [t.id, t]));
        return payoutItems.map(item => ({
            ...item,
            therapistName: therapistMap.get(item.therapistId)?.name || 'N/A',
            therapistPan: therapistMap.get(item.therapistId)?.tax?.pan || 'N/A',
        }));
    }, [payoutItems, therapists]);

    const handleExport = () => {
        const headers = [
            "Payout Item ID", "Source ID (Booking/Order)", "Type", "Created At", "Week Start",
            "Therapist ID", "Therapist Name", "Therapist PAN",
            "Patient ID", "Service Type",
            "Gross Amount (Paise)", "Platform Fee Pct", "Platform Fee Amount (Paise)", "GST on Platform Fee (Paise)",
            "Pre-TDS Payable (Paise)", "TDS Deducted (Paise)", "Net Payable (Paise)",
            "Currency", "State", "Membership Plan Snapshot"
        ];
        
        const data = combinedData.map(item => [
            item.id,
            item.sourceId,
            item.type,
            getSafeDate(item.createdAt)?.toISOString() || '',
            item.weekStart,
            item.therapistId,
            item.therapistName,
            item.therapistPan,
            item.patientId,
            item.serviceTypeId,
            item.grossAmount,
            item.platformFeePct,
            item.platformFeeAmount,
            item.gstOnPlatformFee || 0,
            item.preTdsPayable || 0,
            item.tdsDeducted || 0,
            item.netAmount,
            item.currency,
            item.state,
            item.membershipPlanSnapshot
        ]);

        downloadCsv(headers, data, 'therapy-financial-report.csv');
    }

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Therapy Financial Report</h1>
            <p className="text-muted-foreground">Detailed breakdown of all payout items for tax and accounting purposes.</p>
        </div>

        <FilterBar 
            showDatePicker 
            showTherapyFilters 
            showSearch
            showAppointmentFilters // This includes therapist and status filters
            onFilterChange={setFilters}
        />
        
        <Card>
            <CardHeader>
                 <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Payout Ledger</CardTitle>
                        <CardDescription>A summary log of all service and product commission items.</CardDescription>
                    </div>
                     <Button onClick={handleExport}><FileDown className="mr-2"/>Export Detailed CSV</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Booking ID</TableHead>
                            <TableHead>Therapist</TableHead>
                            <TableHead>PAN</TableHead>
                            <TableHead className="text-right">Gross</TableHead>
                            <TableHead className="text-right">Platform Fee</TableHead>
                            <TableHead className="text-right">GST on Fee</TableHead>
                            <TableHead className="text-right">TDS</TableHead>
                            <TableHead className="text-right">Net Payable</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading ? (
                         <TableRow><TableCell colSpan={9}><Skeleton className="h-24 w-full" /></TableCell></TableRow>
                    ) : combinedData.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs">{item.sourceId}</TableCell>
                            <TableCell>{item.therapistName}</TableCell>
                            <TableCell className="font-mono text-xs">{item.therapistPan}</TableCell>
                            <TableCell className="text-right"><Price amount={item.grossAmount / 100} showDecimals /></TableCell>
                            <TableCell className="text-right"><Price amount={item.platformFeeAmount / 100} showDecimals /></TableCell>
                            <TableCell className="text-right"><Price amount={(item.gstOnPlatformFee || 0) / 100} showDecimals /></TableCell>
                            <TableCell className="text-right"><Price amount={(item.tdsDeducted || 0) / 100} showDecimals /></TableCell>
                            <TableCell className="text-right font-bold"><Price amount={item.netAmount / 100} showDecimals /></TableCell>
                            <TableCell><Badge variant="secondary">{item.state}</Badge></TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        </div>
    );
}
